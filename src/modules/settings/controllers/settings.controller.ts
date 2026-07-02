import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SettingsService } from '../services/settings.service';
import { UpdateClinicSettingsDto } from '../dto/update-clinic-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Patch()
  @Roles('ADMIN')
  update(@Body() dto: UpdateClinicSettingsDto) {
    return this.service.update(dto);
  }
}
