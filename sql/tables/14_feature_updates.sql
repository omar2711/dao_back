-- ─── Migration 14: Feature updates ───────────────────────────────────────────
-- Citas para pacientes no registrados (guest)
ALTER TABLE appointments ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Observaciones por diente en odontograma
ALTER TABLE odontogramas ADD COLUMN IF NOT EXISTS tooth_observations JSONB DEFAULT '{}';

-- Campo requiere laboratorio en tratamientos
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS requires_laboratory BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS laboratory_notes TEXT;
