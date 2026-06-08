import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalHistory } from './entities/clinical-history.entity';
import { ClinicalHistoriesService } from './services/clinical-histories.service';
import { ClinicalHistoriesController } from './controllers/clinical-histories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalHistory])],
  controllers: [ClinicalHistoriesController],
  providers: [ClinicalHistoriesService],
  exports: [ClinicalHistoriesService],
})
export class ClinicalHistoriesModule {}
