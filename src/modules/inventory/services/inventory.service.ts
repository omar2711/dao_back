import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { CreateInventoryMovementDto } from '../dto/create-inventory-movement.dto';

export interface ConsumptionRow {
  id: string;
  name: string;
  totalQuantity: number;
  totalCost: number;
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

  createMovement(dto: CreateInventoryMovementDto): Promise<InventoryMovement> {
    return this.dataSource.transaction(async (manager) => {
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
    });
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
      .addSelect('COALESCE(SUM(m.quantity * m.unit_cost), 0)', 'totalCost')
      .addSelect('COUNT(*)', 'movementCount')
      .where("m.type = 'OUT'")
      .andWhere('m.doctor_id IS NOT NULL')
      .groupBy('m.doctor_id')
      .addGroupBy('d.first_name')
      .addGroupBy('d.last_name')
      .orderBy('"totalCost"', 'DESC');
    if (from) query.andWhere('m.created_at >= :from', { from });
    if (to) query.andWhere('m.created_at <= :to', { to });

    const rows = await query.getRawMany();
    return rows.map((r) => ({
      doctorId: r.doctorId,
      doctorName: r.doctorName,
      totalQuantity: Number(r.totalQuantity),
      totalCost: Number(r.totalCost),
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
      .addSelect('COALESCE(SUM(m.quantity * m.unit_cost), 0)', 'totalCost')
      .addSelect('COUNT(*)', 'movementCount')
      .where("m.type = 'OUT'")
      .andWhere('m.treatment_id IS NOT NULL')
      .groupBy('m.treatment_id')
      .addGroupBy('t.type')
      .orderBy('"totalCost"', 'DESC');
    if (from) query.andWhere('m.created_at >= :from', { from });
    if (to) query.andWhere('m.created_at <= :to', { to });

    const rows = await query.getRawMany();
    return rows.map((r) => ({
      treatmentId: r.treatmentId,
      treatmentType: r.treatmentType,
      totalQuantity: Number(r.totalQuantity),
      totalCost: Number(r.totalCost),
      movementCount: Number(r.movementCount),
    }));
  }
}
