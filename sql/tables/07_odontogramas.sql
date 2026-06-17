-- Odontograma - NTS 150-MINSA-2019/DGIESP (Sistema Dígito Dos / FDI)
-- teeth_data: JSONB keyed by FDI tooth number, each value = array of findings
-- surfaces: caras afectadas (O, M, D, V, L). roots: índices de raíz (0-based) con
-- tratamiento pulpar. Al ser JSONB no requiere migración para nuevos campos.
-- Example: { "11": [{"code":"AM","color":"blue","surfaces":["O","M"]},
--                   {"code":"TC","color":"blue","roots":[0]}] }
CREATE TABLE IF NOT EXISTS odontogramas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id           UUID NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
  clinical_history_id UUID REFERENCES clinical_histories(id) ON DELETE SET NULL,
  tipo    VARCHAR(20) NOT NULL DEFAULT 'INICIAL'
            CHECK (tipo IN ('INICIAL', 'EVOLUCION')),
  fecha   DATE        NOT NULL DEFAULT CURRENT_DATE,
  teeth_data    JSONB NOT NULL DEFAULT '{}',
  especificaciones TEXT,
  observaciones    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_odontogramas_patient          ON odontogramas(patient_id);
CREATE INDEX IF NOT EXISTS idx_odontogramas_doctor           ON odontogramas(doctor_id);
CREATE INDEX IF NOT EXISTS idx_odontogramas_clinical_history ON odontogramas(clinical_history_id);
CREATE INDEX IF NOT EXISTS idx_odontogramas_tipo             ON odontogramas(tipo);

-- Trigger added in sql/triggers/01_updated_at.sql
