import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalHistory } from './entities/clinical-history.entity';
import { ClinicalHistoryFile } from './entities/clinical-history-file.entity';
import { ClinicalHistoryEntry } from './entities/clinical-history-entry.entity';
import { ClinicalHistoriesService } from './services/clinical-histories.service';
import { ClinicalHistoryFilesService } from './services/clinical-history-files.service';
import { ClinicalHistoryEntriesService } from './services/clinical-history-entries.service';
import { ClinicalHistoriesController } from './controllers/clinical-histories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalHistory,
      ClinicalHistoryFile,
      ClinicalHistoryEntry,
    ]),
  ],
  controllers: [ClinicalHistoriesController],
  providers: [
    ClinicalHistoriesService,
    ClinicalHistoryFilesService,
    ClinicalHistoryEntriesService,
  ],
  exports: [ClinicalHistoriesService],
})
export class ClinicalHistoriesModule {}
