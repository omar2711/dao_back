import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { CreateInventoryMovementDto } from '../dto/create-inventory-movement.dto';

export interface ConsumptionRow {
  id: string;
  name: string;
  totalQuantity: number;
  movementCount: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private items: Repository<InventoryItem>,
    @InjectRepository(InventoryMovement)
    private movements: Repository<InventoryMovement>,
    private dataSource: DataSource,
  ) {}

  // ─── Items ──────────────────────────────────────────────────────────────────

  createItem(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const record = this.items.create(dto);
    return this.items.save(record);
  }

  findAllItems(lowStock?: boolean): Promise<InventoryItem[]> {
    const query = this.items.createQueryBuilder('i').orderBy('i.name', 'ASC');
    if (lowStock) query.where('i.current_stock <= i.min_stock');
    return query.getMany();
  }

  async findOneItem(id: string): Promise<InventoryItem> {
    const record = await this.items.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Insumo no encontrado');
    return record;
  }

  async updateItem(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const record = await this.findOneItem(id);
    Object.assign(record, dto);
    return this.items.save(record);
  }

  async removeItem(id: string): Promise<{ message: string }> {
    const record = await this.findOneItem(id);
    await this.items.remove(record);
    return { message: 'Insumo eliminado' };
  }

  // ─── Movements ───────────────────────────────────────────────────────────────

  // Cuando se pasa un `manager`, la operación participa en la transacción del
  // llamador (ej. crear una sesión de tratamiento con sus insumos) en vez de
  // abrir una transacción propia — así un fallo revierte todo junto.
  createMovement(dto: CreateInventoryMovementDto, manager?: EntityManager): Promise<InventoryMovement> {
    if (manager) return this.runCreateMovement(manager, dto);
    return this.dataSource.transaction((m) => this.runCreateMovement(m, dto));
  }

  private async runCreateMovement(
    manager: EntityManager,
    dto: CreateInventoryMovementDto,
  ): Promise<InventoryMovement> {
    const itemRepo = manager.getRepository(InventoryItem);
    const movRepo = manager.getRepository(InventoryMovement);

    const item = await itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('Insumo no encontrado');

    const qty = Number(dto.quantity);
    const current = Number(item.currentStock);
    let next = current;
    if (dto.type === 'IN') next = current + qty;
    else if (dto.type === 'OUT') next = current - qty;
    else next = qty; // ADJUST: fija el stock al valor indicado

    if (next < 0) {
      throw new BadRequestException(
        `Stock insuficiente: disponible ${current}, solicitado ${qty}`,
      );
    }

    const movement = movRepo.create({
      ...dto,
      unitCost: dto.unitCost ?? Number(item.unitCost),
    });
    const saved = await movRepo.save(movement);

    await itemRepo.update(item.id, { currentStock: next });
    return saved;
  }

  // Revierte el consumo de una sesión eliminada: devuelve la cantidad al
  // stock de cada insumo y borra los movimientos OUT asociados a la sesión.
  async reverseSessionMovements(manager: EntityManager, treatmentSessionId: string): Promise<void> {
    const movRepo = manager.getRepository(InventoryMovement);
    const itemRepo = manager.getRepository(InventoryItem);

    const sessionMovements = await movRepo.find({
      where: { treatmentSessionId, type: 'OUT' },
    });
    if (sessionMovements.length === 0) return;

    for (const mv of sessionMovements) {
      await itemRepo.increment({ id: mv.itemId }, 'currentStock', Number(mv.quantity));
    }
    await movRepo.remove(sessionMovements);
  }

  listMovements(filters: {
    itemId?: string;
    doctorId?: string;
    treatmentId?: string;
    from?: string;
    to?: string;
  }): Promise<InventoryMovement[]> {
    const query = this.movements
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.item', 'item')
      .leftJoinAndSelect('m.doctor', 'doctor')
      .orderBy('m.created_at', 'DESC');

    if (filters.itemId) query.andWhere('m.item_id = :itemId', { itemId: filters.itemId });
    if (filters.doctorId) query.andWhere('m.doctor_id = :doctorId', { doctorId: filters.doctorId });
    if (filters.treatmentId) query.andWhere('m.treatment_id = :treatmentId', { treatmentId: filters.treatmentId });
    if (filters.from) query.andWhere('m.created_at >= :from', { from: filters.from });
    if (filters.to) query.andWhere('m.created_at <= :to', { to: filters.to });

    return query.getMany();
  }

  async consumptionByDoctor(from?: string, to?: string) {
    const query = this.movements
      .createQueryBuilder('m')
      .leftJoin('m.doctor', 'd')
      .select('m.doctor_id', 'doctorId')
      .addSelect("d.first_name || ' ' || d.last_name", 'doctorName')
      .addSelect('COALESCE(SUM(m.quantity), 0)', 'totalQuantity')
      .addSelect('COUNT(*)', 'movementCount')
      .where("m.type = 'OUT'")
      .andWhere('m.doctor_id IS NOT NULL')
      .groupBy('m.doctor_id')
      .addGroupBy('d.first_name')
      .addGroupBy('d.last_name')
      .orderBy('"totalQuantity"', 'DESC');
    if (from) query.andWhere('m.created_at >= :from', { from });
    if (to) query.andWhere('m.created_at <= :to', { to });

    const rows = await query.getRawMany();
    return rows.map((r) => ({
      doctorId: r.doctorId,
      doctorName: r.doctorName,
      totalQuantity: Number(r.totalQuantity),
      movementCount: Number(r.movementCount),
    }));
  }

  async consumptionByTreatment(from?: string, to?: string) {
    const query = this.movements
      .createQueryBuilder('m')
      .leftJoin('m.treatment', 't')
      .select('m.treatment_id', 'treatmentId')
      .addSelect('t.type', 'treatmentType')
      .addSelect('COALESCE(SUM(m.quantity), 0)', 'totalQuantity')
      .addSelect('COUNT(*)', 'movementCount')
      .where("m.type = 'OUT'")
      .andWhere('m.treatment_id IS NOT NULL')
      .groupBy('m.treatment_id')
      .addGroupBy('t.type')
      .orderBy('"totalQuantity"', 'DESC');
    if (from) query.andWhere('m.created_at >= :from', { from });
    if (to) query.andWhere('m.created_at <= :to', { to });

    const rows = await query.getRawMany();
    return rows.map((r) => ({
      treatmentId: r.treatmentId,
      treatmentType: r.treatmentType,
      totalQuantity: Number(r.totalQuantity),
      movementCount: Number(r.movementCount),
    }));
  }
}
