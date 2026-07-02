import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { NotificationsService } from '../services/notifications.service';

// Bandeja de notificaciones para el rol ADMIN (ej. avisos de sesiones
// eliminadas por un doctor). No hay noción de destinatario individual: es un
// canal compartido para todos los administradores.
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findRecent() {
    return this.service.findRecent();
  }

  @Get('unread-count')
  async unreadCount() {
    return { count: await this.service.countUnread() };
  }

  @Post('mark-all-read')
  markAllRead() {
    return this.service.markAllRead();
  }
}
