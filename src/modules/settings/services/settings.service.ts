import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicSettings } from '../entities/clinic-settings.entity';
import { UpdateClinicSettingsDto } from '../dto/update-clinic-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(ClinicSettings)
    private repo: Repository<ClinicSettings>,
  ) {}

  // Siempre hay una única fila; se crea con valores por defecto si no existe.
  async get(): Promise<ClinicSettings> {
    const existing = await this.repo.find({ take: 1 });
    if (existing.length > 0) return existing[0];
    return this.repo.save(this.repo.create({}));
  }

  async update(dto: UpdateClinicSettingsDto): Promise<ClinicSettings> {
    const settings = await this.get();
    Object.assign(settings, dto);
    return this.repo.save(settings);
  }
}
