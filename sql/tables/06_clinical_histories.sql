-- Historia Clínica Odontológica - NTS 150-MINSA-2019/DGIESP
CREATE TABLE IF NOT EXISTS clinical_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id  UUID NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
  -- Número HC y fecha/hora de registro
  hc_number  TEXT,
  fecha      DATE        NOT NULL DEFAULT CURRENT_DATE,
  hora       TIME,
  -- ANAMNESIS - MOTIVO DE CONSULTA
  motivo_consulta TEXT,
  -- ENFERMEDAD ACTUAL
  enfermedad_actual      TEXT,
  tiempo_enfermedad      TEXT,
  signos_sintomas        TEXT,
  relato_cronologico     TEXT,
  funciones_biologicas   TEXT,
  -- ANTECEDENTES
  antecedentes_familiares  TEXT,
  antecedentes_personales  TEXT,
  viajes_ultimo_anio       TEXT,
  -- EXAMEN CLÍNICO
  signos_vitales_pa      TEXT,
  signos_vitales_pulso   TEXT,
  signos_vitales_temp    TEXT,
  signos_vitales_fc      TEXT,
  signos_vitales_fr      TEXT,
  examen_clinico_general              TEXT,
  examen_clinico_odontoestomatologico TEXT,
  -- DIAGNÓSTICO (CIE 10)
  diagnostico_presuntivo TEXT,
  diagnostico_definitivo TEXT,
  -- PLAN DE TRATAMIENTO
  plan_tratamiento TEXT,
  -- PRONÓSTICO
  pronostico TEXT,
  -- TRATAMIENTO / RECOMENDACIONES
  tratamiento_recomendaciones TEXT,
  -- CONTROL Y EVOLUCIÓN
  control_evolucion TEXT,
  -- ALTA DEL PACIENTE
  alta_paciente TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_histories_patient ON clinical_histories(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_histories_doctor  ON clinical_histories(doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_histories_fecha   ON clinical_histories(fecha DESC);

-- Trigger added in sql/triggers/01_updated_at.sql
