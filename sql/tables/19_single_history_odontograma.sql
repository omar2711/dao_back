-- ============================================================================
-- 19 · Un solo odontograma y una sola historia clínica por paciente
-- ============================================================================
-- Consolida los duplicados existentes conservando SIEMPRE el registro más
-- reciente de cada paciente, reasigna las claves foráneas al superviviente,
-- borra el resto y añade los índices únicos que impiden volver a duplicar.
--
-- IMPORTANTE: el orden importa. Primero se reasignan las FK y después se
-- borra; si se hiciera al revés, treatments.clinical_history_id y
-- budgets.odontograma_id quedarían en NULL por el ON DELETE SET NULL.
--
-- Crea además la tabla clinical_history_entries (hoja de evolución): a partir
-- de ahora la evolución del paciente se registra como actualizaciones dentro
-- de su historia clínica única, no creando fichas nuevas.
--
-- Ejecutar una sola vez:  psql "$DATABASE_URL" -f 19_single_history_odontograma.sql
-- ============================================================================

BEGIN;

-- ─── 1. Historias clínicas: consolidar en la más reciente por paciente ──────

-- Superviviente por paciente: la de fecha más reciente; a igualdad, la creada
-- después. El id desempata para que el resultado sea determinista.
CREATE TEMP TABLE keep_hc ON COMMIT DROP AS
SELECT DISTINCT ON (patient_id) patient_id, id
FROM clinical_histories
ORDER BY patient_id, fecha DESC NULLS LAST, created_at DESC, id DESC;

-- Reasignar todo lo que apunte a una HC que va a desaparecer.
UPDATE odontogramas o
SET clinical_history_id = k.id
FROM clinical_histories ch
JOIN keep_hc k ON k.patient_id = ch.patient_id
WHERE o.clinical_history_id = ch.id
  AND ch.id <> k.id;

UPDATE treatments t
SET clinical_history_id = k.id
FROM clinical_histories ch
JOIN keep_hc k ON k.patient_id = ch.patient_id
WHERE t.clinical_history_id = ch.id
  AND ch.id <> k.id;

UPDATE budgets b
SET clinical_history_id = k.id
FROM clinical_histories ch
JOIN keep_hc k ON k.patient_id = ch.patient_id
WHERE b.clinical_history_id = ch.id
  AND ch.id <> k.id;

-- Los archivos adjuntos se mueven a la HC superviviente en vez de perderse
-- con el CASCADE.
UPDATE clinical_history_files f
SET clinical_history_id = k.id
FROM clinical_histories ch
JOIN keep_hc k ON k.patient_id = ch.patient_id
WHERE f.clinical_history_id = ch.id
  AND ch.id <> k.id;

DELETE FROM clinical_histories
WHERE id NOT IN (SELECT id FROM keep_hc);

-- ─── 2. Odontogramas: consolidar en el más reciente por paciente ────────────

CREATE TEMP TABLE keep_odo ON COMMIT DROP AS
SELECT DISTINCT ON (patient_id) patient_id, id
FROM odontogramas
ORDER BY patient_id, fecha DESC NULLS LAST, created_at DESC, id DESC;

UPDATE budgets b
SET odontograma_id = k.id
FROM odontogramas o
JOIN keep_odo k ON k.patient_id = o.patient_id
WHERE b.odontograma_id = o.id
  AND o.id <> k.id;

DELETE FROM odontogramas
WHERE id NOT IN (SELECT id FROM keep_odo);

-- ─── 3. Reglas de unicidad ──────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS uq_clinical_history_patient
  ON clinical_histories(patient_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_odontograma_patient
  ON odontogramas(patient_id);

-- El tipo (INICIAL/EVOLUCION) ya no se usa: con un único odontograma por
-- paciente se trabaja siempre sobre el mismo. La columna se conserva con su
-- valor por defecto para no romper el CHECK ni el DDL existente.
UPDATE odontogramas SET tipo = 'INICIAL' WHERE tipo IS DISTINCT FROM 'INICIAL';
DROP INDEX IF EXISTS idx_odontogramas_tipo;

-- Columna presente en la entidad pero en ningún SQL previo: falta en cualquier
-- despliegue que corra con synchronize=false.
ALTER TABLE odontogramas ADD COLUMN IF NOT EXISTS plan_tratamiento TEXT;

-- ─── 4. Hoja de evolución de la historia clínica ────────────────────────────
-- Cada consulta posterior se registra aquí como una actualización fechada,
-- en lugar de abrir una historia clínica nueva.

CREATE TABLE IF NOT EXISTS clinical_history_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_history_id UUID NOT NULL REFERENCES clinical_histories(id) ON DELETE CASCADE,
  doctor_id           UUID REFERENCES doctors(id) ON DELETE SET NULL,
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  motivo        TEXT,
  procedimiento TEXT,
  indicaciones  TEXT,
  observaciones TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_history_entries_history
  ON clinical_history_entries(clinical_history_id, fecha DESC);

-- ─── 5. Índices que faltaban para los reportes por doctor ───────────────────
-- El desglose agrupa por tipo y filtra por rango de fechas sobre start_date.

CREATE INDEX IF NOT EXISTS idx_treatments_start_date ON treatments(start_date);
CREATE INDEX IF NOT EXISTS idx_treatments_type       ON treatments(type);

COMMIT;
