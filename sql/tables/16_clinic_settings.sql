-- ─── Migration 16: Configuración de la clínica ────────────────────────────────
-- Fila única (singleton) con datos generales y preferencias de notificación.
CREATE TABLE IF NOT EXISTS clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name TEXT NOT NULL DEFAULT 'DAO Dent',
  contact_email TEXT,
  phone TEXT,
  notify_appointments_confirmed BOOLEAN NOT NULL DEFAULT true,
  notify_appointment_reminders BOOLEAN NOT NULL DEFAULT true,
  notify_new_patients BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
