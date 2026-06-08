-- Patients table

CREATE TABLE IF NOT EXISTS patients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  birth_date   DATE,
  gender       TEXT,
  phone        TEXT,
  email        TEXT,
  address      TEXT,
  observations TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(lower(first_name || ' ' || last_name));
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
