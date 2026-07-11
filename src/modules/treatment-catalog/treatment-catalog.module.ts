import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentCatalogItem } from './entities/treatment-catalog-item.entity';
import { TreatmentCatalogService } from './services/treatment-catalog.service';
import { TreatmentCatalogController } from './controllers/treatment-catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TreatmentCatalogItem])],
  controllers: [TreatmentCatalogController],
  providers: [TreatmentCatalogService],
  exports: [TreatmentCatalogService],
})
export class TreatmentCatalogModule {}
