-- Add filiation fields to patients table (Historia Clínica Odontológica - MINSA 2019)
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS dni             TEXT,
  ADD COLUMN IF NOT EXISTS procedencia     TEXT,
  ADD COLUMN IF NOT EXISTS ocupacion       TEXT,
  ADD COLUMN IF NOT EXISTS emergencia_contacto TEXT;
