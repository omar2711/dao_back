import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ClinicalHistoriesService } from '../services/clinical-histories.service';
import { ClinicalHistoryFilesService } from '../services/clinical-history-files.service';
import { CreateClinicalHistoryDto } from '../dto/create-clinical-history.dto';
import { UpdateClinicalHistoryDto } from '../dto/update-clinical-history.dto';
import { clinicalHistoryFileInterceptorOptions } from '../utils/clinical-history-file-storage';

@Controller('clinical-histories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicalHistoriesController {
  constructor(
    private readonly service: ClinicalHistoriesService,
    private readonly filesService: ClinicalHistoryFilesService,
  ) {}

  @Post()
  create(@Body() dto: CreateClinicalHistoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('patientId') patientId?: string) {
    return this.service.findAll(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClinicalHistoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/files')
  @UseInterceptors(FilesInterceptor('files', 10, clinicalHistoryFileInterceptorOptions))
  uploadFiles(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.filesService.create(id, files);
  }

  @Get(':id/files')
  getFiles(@Param('id') id: string) {
    return this.filesService.findByHistory(id);
  }

  @Delete(':id/files/:fileId')
  removeFile(@Param('id') id: string, @Param('fileId') fileId: string) {
    return this.filesService.remove(id, fileId);
  }
}
