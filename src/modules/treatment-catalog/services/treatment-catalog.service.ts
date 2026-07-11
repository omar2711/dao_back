import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TreatmentCatalogItem,
  TreatmentCategory,
} from '../entities/treatment-catalog-item.entity';
import { CreateTreatmentCatalogItemDto } from '../dto/create-treatment-catalog-item.dto';
import { UpdateTreatmentCatalogItemDto } from '../dto/update-treatment-catalog-item.dto';

// Lista fija inicial (precios en 0; el admin los edita luego).
const SEED: Record<TreatmentCategory, string[]> = {
  [TreatmentCategory.ADULTO]: [
    'RESINAS SIMPLES',
    'RESINAS COMPUESTAS',
    'RESINAS COMPLEJAS',
    'INCRUSTACIONES DE IVOCROM',
    'INCRUSTACIONES DE CEROM',
    'CORONAS DE IVOCROM',
    'CORONAS DE PORCELANA',
    'CORONAS DE ZIRCONIO',
    'ENDODONCIA UNIRRADICULARES',
    'ENDODONCIA PREMOLAR',
    'ENDODONCIA DE MOLAR',
    'EXTRACCIONES SIMPLES',
    'EXTRACCIONES COMPLEJAS',
    'DESTARTRAJE',
    'BLANQUEAMIENTO',
    'PROTESIS TOTALES',
    'PROTESIS PARCIALES METALICAS',
    'PROTESIS PARCIALES FLEXIBLES',
    'RECONSTRUCCION INCISAL',
    'CARILLAS DE RESINA',
    'CARILLAS DE SILICATO',
    'PERNOS',
    'IMPLANTE',
    'RADIOGRAFIAS',
    'GINGIVOPLASTIA',
    'TOTAL EN RESINA TRIPLEX',
    'PPR EN RESINA TRIFLEX',
    'ENDOCROWN CEROMERO',
  ],
  [TreatmentCategory.NINO]: [
    'PULPECTOMIA',
    'EXTRACCIONES',
    'SELLANTES',
    'FLUORIZACION PROFILAXIS',
    'RESINAS',
    'SEDACION',
  ],
  [TreatmentCategory.ORTODONCIA]: ['INICIAL', 'CONTROL'],
};

@Injectable()
export class TreatmentCatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(TreatmentCatalogItem)
    private repo: Repository<TreatmentCatalogItem>,
  ) {}

  // Siembra la lista fija una sola vez si la tabla está vacía.
  async onModuleInit(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return;
    const items: TreatmentCatalogItem[] = [];
    for (const category of Object.keys(SEED) as TreatmentCategory[]) {
      SEED[category].forEach((name, i) => {
        items.push(
          this.repo.create({ name, category, price: 0, active: true, sortOrder: i }),
        );
      });
    }
    await this.repo.save(items);
  }

  findAll(onlyActive = false): Promise<TreatmentCatalogItem[]> {
    const query = this.repo
      .createQueryBuilder('t')
      .orderBy('t.category', 'ASC')
      .addOrderBy('t.sort_order', 'ASC')
      .addOrderBy('t.name', 'ASC');
    if (onlyActive) query.where('t.active = true');
    return query.getMany();
  }

  create(dto: CreateTreatmentCatalogItemDto): Promise<TreatmentCatalogItem> {
    const record = this.repo.create(dto);
    return this.repo.save(record);
  }

  async update(
    id: string,
    dto: UpdateTreatmentCatalogItemDto,
  ): Promise<TreatmentCatalogItem> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Tratamiento del catálogo no encontrado');
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Tratamiento del catálogo no encontrado');
    await this.repo.remove(record);
    return { message: 'Tratamiento del catálogo eliminado' };
  }
}
