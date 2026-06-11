import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { ClinicalHistoryFile } from '../entities/clinical-history-file.entity';
import { CLINICAL_HISTORY_UPLOADS_ROOT, clinicalHistoryFileUrl } from '../utils/clinical-history-file-storage';

@Injectable()
export class ClinicalHistoryFilesService {
  constructor(
    @InjectRepository(ClinicalHistoryFile)
    private repo: Repository<ClinicalHistoryFile>,
  ) {}

  create(clinicalHistoryId: string, files: Express.Multer.File[]): Promise<ClinicalHistoryFile[]> {
    const records = files.map((file) =>
      this.repo.create({
        clinicalHistoryId,
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: clinicalHistoryFileUrl(clinicalHistoryId, file.filename),
      }),
    );
    return this.repo.save(records);
  }

  findByHistory(clinicalHistoryId: string): Promise<ClinicalHistoryFile[]> {
    return this.repo.find({
      where: { clinicalHistoryId },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(clinicalHistoryId: string, fileId: string): Promise<{ message: string }> {
    const record = await this.repo.findOne({ where: { id: fileId, clinicalHistoryId } });
    if (!record) throw new NotFoundException('Archivo no encontrado');

    const filePath = join(CLINICAL_HISTORY_UPLOADS_ROOT, clinicalHistoryId, record.fileName);
    if (existsSync(filePath)) unlinkSync(filePath);

    await this.repo.remove(record);
    return { message: 'Archivo eliminado' };
  }
}
