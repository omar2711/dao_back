import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { WhatsappService } from '../services/whatsapp.service';

class SendTestDto {
  @IsString()
  phone: string;

  @IsString()
  message: string;
}

// Gestión de la conexión de WhatsApp — solo ADMIN.
@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  @Get('status')
  status() {
    return this.service.getStatus();
  }

  @Post('logout')
  logout() {
    return this.service.logout();
  }

  @Post('send-test')
  async sendTest(@Body() dto: SendTestDto) {
    await this.service.sendText(dto.phone, dto.message);
    return { message: 'Mensaje de prueba enviado.' };
  }
}
