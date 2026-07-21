-- ─── Migration 17: WhatsApp (recordatorios) + Presupuestos ────────────────────
-- Ejecutar en producción (donde synchronize=false). En desarrollo TypeORM
-- sincroniza el esquema automáticamente.

-- 1) Configuración de WhatsApp en el singleton de la clínica.
ALTER TABLE clinic_settings
  ADD COLUMN IF NOT EXISTS session_duration TEXT NOT NULL DEFAULT '7d',
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_lead_minutes INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_template TEXT NOT NULL
    DEFAULT 'Hola {paciente}, le recordamos su cita el {fecha} a las {hora} con el Dr(a). {doctor}. {clinica}';

-- 2) Marca de recordatorio enviado (evita reenvíos).
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- 3) Presupuestos (cotizaciones armadas desde el odontograma).
CREATE TABLE IF NOT EXISTS budgets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id           UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  odontograma_id      UUID REFERENCES odontogramas(id) ON DELETE SET NULL,
  clinical_history_id UUID REFERENCES clinical_histories(id) ON DELETE SET NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
  notes               TEXT,
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budgets_patient ON budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status  ON budgets(status);

-- 4) Líneas del presupuesto: un tratamiento del catálogo por diente.
CREATE TABLE IF NOT EXISTS budget_items (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id                 UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  tooth_number              VARCHAR(10),
  treatment_catalog_item_id UUID REFERENCES treatment_catalog_items(id) ON DELETE SET NULL,
  treatment_name            TEXT NOT NULL,
  price                     NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes                     TEXT
);

CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
