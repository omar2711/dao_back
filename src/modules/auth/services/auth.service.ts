import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { SettingsService } from '../../settings/services/settings.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private settingsService: SettingsService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(
    user: { id: string; email: string; role: string },
    rememberMe = false,
  ) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    // Duración configurable desde el módulo de Configuración. Con "Recuérdame"
    // se usa una duración larga fija para mantener la sesión más tiempo.
    const settings = await this.settingsService.get();
    const sessionDuration = settings.sessionDuration || '7d';
    const expiresIn = (rememberMe ? '30d' : sessionDuration) as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`;
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
      }),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('La contraseña actual es incorrecta');
    await this.usersService.update(userId, { password: newPassword });
    return { message: 'Contraseña actualizada' };
  }

  refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const newPayload = { sub: payload.sub, email: payload.email, role: payload.role };
      return { accessToken: this.jwtService.sign(newPayload) };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
