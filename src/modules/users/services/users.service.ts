import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({ email: dto.email, role: dto.role, passwordHash });
    return this.repo.save(user);
  }

  findAll(): Promise<User[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.password) {
      (user as any).passwordHash = await bcrypt.hash(dto.password, 12);
    }
    if (dto.email) user.email = dto.email;
    if (dto.role) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    return this.repo.save(user);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.repo.remove(user);
    return { message: 'User deleted' };
  }
}
