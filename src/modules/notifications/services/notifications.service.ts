import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  create(message: string): Promise<Notification> {
    return this.repo.save(this.repo.create({ message }));
  }

  findRecent(limit = 30): Promise<Notification[]> {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  countUnread(): Promise<number> {
    return this.repo.count({ where: { read: false } });
  }

  async markAllRead(): Promise<{ message: string }> {
    await this.repo.update({ read: false }, { read: true });
    return { message: 'Notificaciones marcadas como leídas' };
  }
}
