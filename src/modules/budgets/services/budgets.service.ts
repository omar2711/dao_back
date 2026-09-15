import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Budget, BudgetStatus } from '../entities/budget.entity';
import { BudgetItem } from '../entities/budget-item.entity';
import { Treatment, TreatmentStatus } from '../../treatments/entities/treatment.entity';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { SettingsService } from '../../settings/services/settings.service';

const money = (n: number) => `S/. ${Number(n || 0).toFixed(2)}`;

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private readonly repo: Repository<Budget>,
    private readonly dataSource: DataSource,
    private readonly settings: SettingsService,
  ) {}

  async create(dto: CreateBudgetDto): Promise<Budget> {
    const budget = this.repo.create({
      patientId: dto.patientId,
      doctorId: dto.doctorId,
      odontogramaId: dto.odontogramaId ?? null,
      clinicalHistoryId: dto.clinicalHistoryId ?? null,
      status: dto.status ?? BudgetStatus.BORRADOR,
      notes: dto.notes ?? null,
      items: (dto.items ?? []).map((i) =>
        this.repo.manager.create(BudgetItem, {
          toothNumber: i.toothNumber ?? null,
          treatmentCatalogItemId: i.treatmentCatalogItemId ?? null,
          treatmentName: i.treatmentName,
          price: i.price,
          notes: i.notes ?? null,
        }),
      ),
    });
    return this.repo.save(budget);
  }

  findAll(patientId?: string): Promise<Budget[]> {
    const query = this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.items', 'items')
      .leftJoinAndSelect('b.patient', 'patient')
      .leftJoinAndSelect('b.doctor', 'doctor')
      .orderBy('b.createdAt', 'DESC');
    if (patientId) query.where('b.patient_id = :patientId', { patientId });
    return query.getMany();
  }

  async findOne(id: string): Promise<Budget> {
    const budget = await this.repo.findOne({
      where: { id },
      relations: { items: true, patient: true, doctor: true, odontograma: true },
    });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    return budget;
  }

  async update(id: string, dto: UpdateBudgetDto): Promise<Budget> {
    const budget = await this.findOne(id);
    if (budget.status === BudgetStatus.APROBADO) {
      throw new BadRequestException('Un presupuesto aprobado no se puede modificar.');
    }

    if (dto.status !== undefined) budget.status = dto.status;
    if (dto.notes !== undefined) budget.notes = dto.notes;
    if (dto.odontogramaId !== undefined) budget.odontogramaId = dto.odontogramaId ?? null;
    if (dto.clinicalHistoryId !== undefined) budget.clinicalHistoryId = dto.clinicalHistoryId ?? null;

    // Si vienen items, se reemplazan por completo (orphanRemoval vía cascade).
    if (dto.items !== undefined) {
      await this.repo.manager.delete(BudgetItem, { budgetId: budget.id });
      budget.items = dto.items.map((i) =>
        this.repo.manager.create(BudgetItem, {
          toothNumber: i.toothNumber ?? null,
          treatmentCatalogItemId: i.treatmentCatalogItemId ?? null,
          treatmentName: i.treatmentName,
          price: i.price,
          notes: i.notes ?? null,
        }),
      );
    }
    return this.repo.save(budget);
  }

  // Aprueba el presupuesto y genera un Tratamiento por cada línea, en una
  // transacción. Los tratamientos quedan editables desde su vista normal.
  async approve(id: string): Promise<{ budget: Budget; treatmentsCreated: number }> {
    const budget = await this.findOne(id);
    if (budget.status === BudgetStatus.APROBADO) {
      throw new BadRequestException('El presupuesto ya fue aprobado.');
    }
    if (!budget.items || budget.items.length === 0) {
      throw new BadRequestException('El presupuesto no tiene tratamientos para generar.');
    }

    const today = new Date().toISOString().slice(0, 10);

    await this.dataSource.transaction(async (manager) => {
      for (const item of budget.items) {
        const treatment = manager.create(Treatment, {
          patientId: budget.patientId,
          doctorId: budget.doctorId,
          clinicalHistoryId: budget.clinicalHistoryId ?? undefined,
          type: item.treatmentName,
          startDate: today,
          status: TreatmentStatus.PROGRAMADO,
          teethAffected: item.toothNumber ? [item.toothNumber] : [],
          cost: Number(item.price) || 0,
        });
        await manager.save(treatment);
      }
      budget.status = BudgetStatus.APROBADO;
      budget.approvedAt = new Date();
      await manager.save(budget);
    });

    return { budget, treatmentsCreated: budget.items.length };
  }

  async remove(id: string): Promise<{ message: string }> {
    const budget = await this.findOne(id);
    await this.repo.remove(budget);
    return { message: 'Presupuesto eliminado' };
  }

  // Prepara el envío del presupuesto por WhatsApp respetando la modalidad
  // (con/sin precio, con/sin dientes).
  //
  // El servidor NO envía el mensaje: devuelve un enlace wa.me con el texto ya
  // redactado para que el navegador lo abra. Enviar desde el servidor exigía
  // Baileys —un socket permanente y disco de escritura—, imposible en las
  // funciones serverless de Vercel, que son efímeras y de sistema de ficheros
  // de solo lectura. El enlace consigue lo mismo sin infraestructura: usa la
  // sesión de WhatsApp que el recepcionista ya tiene abierta.
  //
  // Contrapartida: wa.me solo admite texto, así que el PDF no viaja adjunto.
  // Se descarga desde la misma pantalla y se adjunta a mano.
  async sendWhatsapp(
    id: string,
    opts: {
      showPrices?: boolean;
      showTeeth?: boolean;
      phone?: string;
      pdfBase64?: string;
      pdfFileName?: string;
    },
  ): Promise<{ message: string; url: string; phone: string }> {
    const budget = await this.findOne(id);
    const phone = opts.phone || budget.patient?.phone;
    if (!phone) throw new BadRequestException('El paciente no tiene un teléfono registrado.');

    const digits = this.toWaNumber(phone);
    if (!digits) throw new BadRequestException(`Teléfono inválido: "${phone}"`);

    const settings = await this.settings.get();
    const text = this.buildText(budget, {
      showPrices: opts.showPrices !== false,
      showTeeth: opts.showTeeth !== false,
      clinicName: settings.clinicName,
    });

    const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;

    // Marcar como ENVIADO si aún es borrador.
    if (budget.status === BudgetStatus.BORRADOR) {
      budget.status = BudgetStatus.ENVIADO;
      await this.repo.save(budget);
    }

    return {
      message: 'Abriendo WhatsApp con el presupuesto listo para enviar.',
      url,
      phone: digits,
    };
  }

  // Normaliza un teléfono peruano al formato que espera wa.me: solo dígitos,
  // con código de país y sin el "+".
  // Acepta "987654321", "+51 987 654 321", "51987654321", etc.
  private toWaNumber(phone: string): string | null {
    let digits = (phone || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length === 9) digits = `51${digits}`; // celular peruano sin código país
    if (digits.startsWith('051')) digits = digits.slice(1);
    return digits;
  }

  private buildText(
    budget: Budget,
    opts: { showPrices: boolean; showTeeth: boolean; clinicName: string },
  ): string {
    const patientName = budget.patient
      ? `${budget.patient.firstName} ${budget.patient.lastName}`.trim()
      : 'Paciente';
    const lines: string[] = [];
    lines.push(`*${opts.clinicName || 'DAO Dent'}* — Presupuesto`);
    lines.push(`Paciente: ${patientName}`);
    lines.push('');
    let total = 0;
    for (const item of budget.items) {
      total += Number(item.price) || 0;
      const tooth = opts.showTeeth && item.toothNumber ? `Pieza ${item.toothNumber}: ` : '';
      const price = opts.showPrices ? ` — ${money(Number(item.price))}` : '';
      lines.push(`• ${tooth}${item.treatmentName}${price}`);
    }
    if (opts.showPrices) {
      lines.push('');
      lines.push(`*Total: ${money(total)}*`);
    }
    return lines.join('\n');
  }
}
