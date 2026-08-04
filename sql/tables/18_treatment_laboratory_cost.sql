-- ─── Migration 18: Costo de laboratorio en tratamientos ──────────────────────
-- Monto que la clínica gasta/cobra por el laboratorio de un tratamiento.
-- Es un cobro aparte: no se suma a treatments.cost ni a treatments.paid.
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS laboratory_cost NUMERIC(10,2) NOT NULL DEFAULT 0;
