import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
} from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import { join } from 'path';
import { rm } from 'fs/promises';

// Logger silencioso compatible con la interfaz que espera Baileys (pino-like).
const silentLogger: any = {
  level: 'silent',
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  child: () => silentLogger,
};

export interface WhatsappStatus {
  connected: boolean;
  connecting: boolean;
  number: string | null;
  qrDataUrl: string | null;
}

// Servicio que mantiene un único socket de Baileys (WhatsApp).
// El auth-state se persiste en la carpeta `whatsapp-auth/` en disco, por lo que
// el QR solo se escanea una vez; tras reinicios reconecta solo.
// IMPORTANTE (despliegue): correr una sola instancia del proceso.
@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly authDir = join(process.cwd(), 'whatsapp-auth');

  private sock: WASocket | null = null;
  private connecting = false;
  private connected = false;
  private connectedNumber: string | null = null;
  private qrDataUrl: string | null = null;

  async onModuleInit() {
    // Conectamos al iniciar para que el QR quede disponible para emparejar.
    // Si no hay credenciales, mostrará un QR; si las hay, reconecta.
    this.connect().catch((e) => this.logger.error(`Error iniciando WhatsApp: ${e}`));
  }

  private async connect(): Promise<void> {
    if (this.connecting) return;
    this.connecting = true;
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        logger: silentLogger,
        browser: ['DAO Dent', 'Chrome', '1.0.0'],
        markOnlineOnConnect: false,
      });
      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          // Nuevo QR pendiente de escanear → generamos data URL para la UI.
          QRCode.toDataURL(qr)
            .then((url) => {
              this.qrDataUrl = url;
              this.connected = false;
              this.connectedNumber = null;
            })
            .catch((e) => this.logger.error(`Error generando QR: ${e}`));
        }

        if (connection === 'open') {
          this.connected = true;
          this.connecting = false;
          this.qrDataUrl = null;
          this.connectedNumber = this.extractNumber(sock.user?.id);
          this.logger.log(`WhatsApp conectado como ${this.connectedNumber ?? '¿?'}`);
        }

        if (connection === 'close') {
          this.connected = false;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const loggedOut = statusCode === DisconnectReason.loggedOut;
          this.connecting = false;
          if (loggedOut) {
            // Sesión cerrada desde el teléfono: limpiar credenciales para un QR nuevo.
            this.logger.warn('WhatsApp cerró sesión. Se requiere volver a escanear el QR.');
            this.connectedNumber = null;
            void this.clearAuthAndReconnect();
          } else {
            // Caída temporal → reconectar.
            this.logger.warn(`WhatsApp desconectado (code ${statusCode}). Reconectando...`);
            setTimeout(() => this.connect().catch(() => undefined), 3000);
          }
        }
      });
    } catch (e) {
      this.connecting = false;
      this.logger.error(`No se pudo conectar a WhatsApp: ${e}`);
    }
  }

  private async clearAuthAndReconnect(): Promise<void> {
    try {
      await rm(this.authDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    this.qrDataUrl = null;
    setTimeout(() => this.connect().catch(() => undefined), 1500);
  }

  private extractNumber(jid?: string): string | null {
    if (!jid) return null;
    // jid ~ "51987654321:12@s.whatsapp.net" → "51987654321"
    return jid.split(':')[0].split('@')[0];
  }

  getStatus(): WhatsappStatus {
    return {
      connected: this.connected,
      connecting: this.connecting,
      number: this.connectedNumber,
      qrDataUrl: this.qrDataUrl,
    };
  }

  isConnected(): boolean {
    return this.connected && !!this.sock;
  }

  // Desconecta y borra credenciales para poder emparejar OTRO número.
  async logout(): Promise<{ message: string }> {
    try {
      await this.sock?.logout();
    } catch {
      /* ignore */
    }
    this.sock = null;
    this.connected = false;
    this.connectedNumber = null;
    await this.clearAuthAndReconnect();
    return { message: 'Sesión de WhatsApp cerrada. Escanee el nuevo QR para vincular otro número.' };
  }

  // Normaliza un teléfono peruano a JID de WhatsApp.
  // Acepta "987654321", "+51 987 654 321", "51987654321", etc.
  private toJid(phone: string): string | null {
    let digits = (phone || '').replace(/\D/g, '');
    if (!digits) return null;
    if (digits.length === 9) digits = `51${digits}`; // celular peruano sin código país
    if (digits.startsWith('051')) digits = digits.slice(1);
    return `${digits}@s.whatsapp.net`;
  }

  // Envía un mensaje de texto. Devuelve true si se envió.
  async sendText(phone: string, text: string): Promise<boolean> {
    if (!this.isConnected() || !this.sock) {
      throw new Error('WhatsApp no está conectado.');
    }
    const jid = this.toJid(phone);
    if (!jid) throw new Error(`Teléfono inválido: "${phone}"`);
    await this.sock.sendMessage(jid, { text });
    return true;
  }
}
