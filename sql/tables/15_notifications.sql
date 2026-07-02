-- ─── Migration 15: Notificaciones ─────────────────────────────────────────────
-- Bandeja compartida para avisos al rol ADMIN (ej. sesión de tratamiento
-- eliminada por un doctor). Sin destinatario individual: es un canal común.
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
