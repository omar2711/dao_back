-- Reemplaza el avance por porcentaje (progress) por un conteo de sesiones.
-- total_sessions: sesiones requeridas del plan. sessions_done: sesiones registradas
-- (se recalcula en el backend al crear/editar/eliminar sesiones).
-- En dev TypeORM (synchronize) crea las columnas solo; este ALTER es para
-- entornos sin synchronize.

ALTER TABLE treatments
  ADD COLUMN IF NOT EXISTS total_sessions INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sessions_done  INTEGER NOT NULL DEFAULT 0;
