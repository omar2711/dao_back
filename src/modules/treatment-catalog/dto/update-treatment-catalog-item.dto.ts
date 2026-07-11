import { PartialType } from '@nestjs/mapped-types';
import { CreateTreatmentCatalogItemDto } from './create-treatment-catalog-item.dto';

export class UpdateTreatmentCatalogItemDto extends PartialType(
  CreateTreatmentCatalogItemDto,
) {}
