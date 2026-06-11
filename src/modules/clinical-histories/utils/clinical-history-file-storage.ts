import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { Request } from 'express';

export const CLINICAL_HISTORY_UPLOADS_ROOT = join(process.cwd(), 'uploads', 'clinical-histories');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

export const clinicalHistoryFileInterceptorOptions = {
  storage: diskStorage({
    destination: (req: Request, _file, cb) => {
      const historyId = req.params.id;
      const dir = join(CLINICAL_HISTORY_UPLOADS_ROOT, historyId);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, accept: boolean) => void) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`), false);
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
};

export const clinicalHistoryFileUrl = (historyId: string, fileName: string) =>
  `/uploads/clinical-histories/${historyId}/${fileName}`;
