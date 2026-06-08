-- Seed de datos de prueba para un flujo completo:
--   1 admin (login), 1 doctor (login + perfil), 1 paciente (sin login)
--   + cita, historia clínica, odontogramas (historial) y tratamientos
--
-- Los pacientes NO inician sesión (no tienen fila en `users`); solo
-- ADMIN y DOCTOR pueden loguearse vía POST /auth/login.
--
-- Credenciales de prueba (cámbialas tras probar):
--   admin@daodent.com  / Admin123!
--   doctor@daodent.com / Doctor123!
--
-- Nota: los usuarios se upsertan por email (idempotente). El resto de
-- registros (doctor, paciente, citas, historia, odontogramas, tratamientos)
-- se crean siempre que se ejecute el script — pensado para correr una sola vez
-- sobre una base de datos de prueba/desarrollo.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_user_id  UUID;
  v_doctor_user_id UUID;
  v_doctor_id      UUID;
  v_patient_id     UUID;
  v_history_id     UUID;
BEGIN
  -- 1) Usuario ADMIN (puede loguearse, gestiona todo)
  INSERT INTO users (email, password_hash, role)
  VALUES ('admin@daodent.com', crypt('Admin123!', gen_salt('bf', 12)), 'ADMIN')
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO v_admin_user_id;

  -- 2) Usuario DOCTOR (puede loguearse) + perfil en `doctors`
  INSERT INTO users (email, password_hash, role)
  VALUES ('doctor@daodent.com', crypt('Doctor123!', gen_salt('bf', 12)), 'DOCTOR')
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO v_doctor_user_id;

  INSERT INTO doctors (user_id, first_name, last_name, phone, specialty, license_number)
  VALUES (v_doctor_user_id, 'Luis', 'Montenegro', '987654321', 'Odontología General', 'COP-12345')
  RETURNING id INTO v_doctor_id;

  -- 3) Paciente — SIN cuenta de usuario, no inicia sesión
  INSERT INTO patients (
    first_name, last_name, birth_date, gender, phone, email, address,
    dni, procedencia, ocupacion, emergencia_contacto, observations
  )
  VALUES (
    'Carlos', 'Mendoza', '1990-05-12', 'M', '999111222', 'carlos.mendoza@example.com',
    'Av. Siempre Viva 123, Lima', '45678912', 'Lima', 'Ingeniero',
    'Ana Mendoza - 999333444', 'Paciente de prueba para flujo completo'
  )
  RETURNING id INTO v_patient_id;

  -- 4) Citas
  INSERT INTO appointments (patient_id, doctor_id, appointment_date, duration_minutes, status, reason, notes)
  VALUES
    (v_patient_id, v_doctor_id, now() + interval '2 days', 30, 'SCHEDULED',
     'Evaluación inicial', 'Primera consulta'),
    (v_patient_id, v_doctor_id, now() + interval '9 days', 45, 'CONFIRMED',
     'Control de tratamiento', 'Seguimiento de endodoncia en pieza 3.6');

  -- 5) Historia clínica (NTS 150-MINSA-2019)
  INSERT INTO clinical_histories (
    patient_id, doctor_id, hc_number, fecha, hora,
    motivo_consulta, enfermedad_actual, tiempo_enfermedad, signos_sintomas,
    relato_cronologico, funciones_biologicas,
    antecedentes_familiares, antecedentes_personales, viajes_ultimo_anio,
    signos_vitales_pa, signos_vitales_pulso, signos_vitales_temp, signos_vitales_fc, signos_vitales_fr,
    examen_clinico_general, examen_clinico_odontoestomatologico,
    diagnostico_presuntivo, diagnostico_definitivo,
    plan_tratamiento, pronostico, tratamiento_recomendaciones, control_evolucion
  )
  VALUES (
    v_patient_id, v_doctor_id, 'HC-2026-0001', CURRENT_DATE, '09:30',
    'Dolor en pieza 3.6 al masticar', 'Molestia progresiva desde hace 2 semanas', '2 semanas',
    'Dolor pulsátil, sensibilidad al frío', 'Inicio gradual, empeora con alimentos fríos', 'Sin alteraciones',
    'Madre con diabetes tipo 2', 'Sin antecedentes relevantes', 'Viaje a Cusco en abril 2026, sin incidentes',
    '120/80', '72', '36.5', '16', '72',
    'Paciente en buen estado general', 'Caries profunda en pieza 3.6, encías sanas',
    'Pulpitis irreversible en pieza 3.6', 'Pulpitis irreversible 3.6 — requiere endodoncia',
    'Endodoncia en pieza 3.6 seguida de restauración con corona', 'Favorable con tratamiento oportuno',
    'Control en 7 días, evitar alimentos duros', 'Pendiente primera sesión de endodoncia'
  )
  RETURNING id INTO v_history_id;

  -- 6) Odontogramas — historial del paciente (INICIAL y EVOLUCION)
  INSERT INTO odontogramas (patient_id, doctor_id, clinical_history_id, tipo, fecha, teeth_data, especificaciones, observaciones)
  VALUES (
    v_patient_id, v_doctor_id, v_history_id, 'INICIAL', CURRENT_DATE,
    '{"36": [{"code":"CARIES","color":"red","surfaces":["O","M"],"type":"CARIES"}],
      "11": [{"code":"AM","color":"blue","surfaces":["O"],"type":"RESTAURACION_DEFINITIVA"}]}'::jsonb,
    'Odontograma inicial de evaluación',
    'Caries activa en 3.6, restauración previa en 1.1'
  );

  INSERT INTO odontogramas (patient_id, doctor_id, clinical_history_id, tipo, fecha, teeth_data, especificaciones, observaciones)
  VALUES (
    v_patient_id, v_doctor_id, v_history_id, 'EVOLUCION', (CURRENT_DATE + interval '7 days')::date,
    '{"36": [{"code":"TC","color":"red","surfaces":["O","M"],"type":"TRATAMIENTO_CONDUCTO"}],
      "11": [{"code":"AM","color":"blue","surfaces":["O"],"type":"RESTAURACION_DEFINITIVA"}]}'::jsonb,
    'Control post primera sesión de endodoncia',
    'Pieza 3.6 en tratamiento de conducto, evolución favorable'
  );

  -- 7) Tratamientos (uno en progreso, uno completado)
  INSERT INTO treatments (
    patient_id, doctor_id, clinical_history_id, type, description,
    start_date, end_date, status, teeth_affected, cost, paid, progress
  )
  VALUES
    (v_patient_id, v_doctor_id, v_history_id, 'Endodoncia', 'Tratamiento de conducto en pieza 3.6',
     CURRENT_DATE, NULL, 'EN_PROGRESO', ARRAY['36'], 450.00, 200.00, 50),
    (v_patient_id, v_doctor_id, v_history_id, 'Limpieza Profesional', 'Destartarización y pulido',
     (CURRENT_DATE - interval '30 days')::date, (CURRENT_DATE - interval '30 days')::date,
     'COMPLETADO', ARRAY[]::text[], 80.00, 80.00, 100);

END $$;
