-- Agrega el tipo de pago a las sesiones de tratamiento.
-- treatment_sessions es gestionada por TypeORM (synchronize en dev); este script
-- es el ALTER para aplicar el cambio manualmente en entornos sin synchronize.

ALTER TABLE treatment_sessions
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

-- Restringe los valores permitidos (idempotente).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_treatment_sessions_payment_method'
  ) THEN
    ALTER TABLE treatment_sessions
      ADD CONSTRAINT chk_treatment_sessions_payment_method
      CHECK (payment_method IS NULL OR payment_method IN
        ('EFECTIVO','YAPE','OTRO'));
  END IF;
END $$;
