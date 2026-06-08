-- Treatments / Planes de tratamiento
-- A treatment groups one or more procedures performed on a patient by a doctor,
-- optionally tied to the clinical history where it was indicated (plan_tratamiento).

CREATE TABLE IF NOT EXISTS treatments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id           UUID NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
  clinical_history_id UUID REFERENCES clinical_histories(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,
  description TEXT,
  start_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date    DATE,
  status      VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO'
                CHECK (status IN ('PROGRAMADO', 'EN_PROGRESO', 'COMPLETADO', 'PAUSADO')),
  teeth_affected TEXT[] NOT NULL DEFAULT '{}',
  cost     NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid     NUMERIC(10,2) NOT NULL DEFAULT 0,
  progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatments_patient          ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_doctor           ON treatments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatments_clinical_history ON treatments(clinical_history_id);
CREATE INDEX IF NOT EXISTS idx_treatments_status           ON treatments(status);

-- Trigger added in sql/triggers/01_updated_at.sql
