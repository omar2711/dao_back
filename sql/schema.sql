--
-- DAO Dent · Esquema completo de PostgreSQL
-- =========================================
--
-- Crea la base entera desde cero: 17 tablas, claves foráneas, restricciones,
-- la función set_updated_at() con sus triggers, y los índices.
--
-- POR QUÉ EXISTE ESTE FICHERO
-- Los ficheros de sql/tables/ están incompletos: `treatment_sessions` y
-- `treatment_catalog_items` nunca tuvieron un CREATE TABLE porque en desarrollo
-- las creó TypeORM con `synchronize: true`. Aplicar solo sql/tables/*.sql en un
-- servidor nuevo deja la base sin esas dos tablas y la aplicación falla en
-- cuanto se registra una sesión de tratamiento o se abre el catálogo.
--
-- Este fichero se generó con `pg_dump --schema-only` sobre la base real, así que
-- refleja exactamente lo que la aplicación espera encontrar.
--
-- USO EN UN SERVIDOR NUEVO
--   createdb daodent
--   psql -d daodent -v ON_ERROR_STOP=1 -f sql/schema.sql
--
-- Requiere un rol con permiso para crear extensiones (pgcrypto, uuid-ossp);
-- en la práctica, ejecutarlo como superusuario o instalar las extensiones antes.
--
-- QUÉ NO INCLUYE
--   · sql/seed/      datos de prueba, nunca en producción.
--   · sql/rls/       las políticas fijan el rol `neondb_owner`, que no existe
--                    fuera de Neon, y con el rol propietario RLS se omite
--                    igualmente. Adáptalas si añades un rol de solo lectura.
--   · sql/functions/01_search_patients.sql   el backend no la invoca.
--
-- MANTENIMIENTO
-- Esto es una foto, no un historial. Los cambios posteriores siguen yendo como
-- ficheros numerados en sql/tables/ y se aplican encima. Para regenerar la foto:
--
--   pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges \
--           --no-tablespaces --no-comments
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- `SET transaction_timeout` lo emite pg_dump 17 pero el parámetro solo existe a
-- partir de PostgreSQL 17: en un servidor 16 o anterior aborta el fichero con
-- «unrecognized configuration parameter». Se omite a propósito para que el
-- esquema cargue también en las versiones que trae Ubuntu por defecto.
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid,
    doctor_id uuid NOT NULL,
    appointment_date timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 30 NOT NULL,
    status character varying DEFAULT 'SCHEDULED'::character varying NOT NULL,
    reason text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    guest_name text,
    reminder_sent_at timestamp with time zone
);


--
-- Name: budget_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    budget_id uuid NOT NULL,
    tooth_number character varying,
    treatment_catalog_item_id uuid,
    treatment_name text NOT NULL,
    price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    notes text
);


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budgets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    odontograma_id uuid,
    clinical_history_id uuid,
    status character varying DEFAULT 'BORRADOR'::character varying NOT NULL,
    notes text,
    approved_at timestamp with time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: clinic_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinic_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    clinic_name character varying DEFAULT 'DAO Dent'::character varying NOT NULL,
    contact_email character varying,
    phone character varying,
    notify_appointments_confirmed boolean DEFAULT true NOT NULL,
    notify_appointment_reminders boolean DEFAULT true NOT NULL,
    notify_new_patients boolean DEFAULT true NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    session_duration character varying DEFAULT '7d'::character varying NOT NULL,
    whatsapp_enabled boolean DEFAULT false NOT NULL,
    whatsapp_reminder_lead_minutes integer DEFAULT 60 NOT NULL,
    whatsapp_reminder_template text DEFAULT 'Hola {paciente}, le recordamos su cita el {fecha} a las {hora} con el Dr(a). {doctor}. {clinica}'::text NOT NULL
);


--
-- Name: clinical_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_histories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    hc_number character varying,
    fecha date NOT NULL,
    hora time without time zone,
    motivo_consulta text,
    enfermedad_actual text,
    tiempo_enfermedad text,
    signos_sintomas text,
    relato_cronologico text,
    funciones_biologicas text,
    antecedentes_familiares text,
    antecedentes_personales text,
    signos_vitales_pa character varying,
    signos_vitales_pulso character varying,
    signos_vitales_temp character varying,
    signos_vitales_fc character varying,
    signos_vitales_fr character varying,
    examen_clinico_general text,
    examen_clinico_odontoestomatologico text,
    diagnostico_presuntivo text,
    diagnostico_definitivo text,
    plan_tratamiento text,
    pronostico text,
    tratamiento_recomendaciones text,
    control_evolucion text,
    alta_paciente text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    viajes_ultimo_anio text,
    alergias text,
    enfermedades text,
    direccion text,
    distrito character varying,
    grado_instruccion character varying,
    procedencia character varying,
    ocupacion character varying,
    emergencia_contacto text,
    observaciones text
);


--
-- Name: clinical_history_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_history_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinical_history_id uuid NOT NULL,
    doctor_id uuid,
    fecha date DEFAULT ('now'::text)::date NOT NULL,
    motivo text,
    procedimiento text,
    indicaciones text,
    observaciones text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: clinical_history_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_history_files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    clinical_history_id uuid NOT NULL,
    file_name character varying NOT NULL,
    original_name character varying NOT NULL,
    mime_type character varying NOT NULL,
    size integer NOT NULL,
    url character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    phone character varying,
    specialty character varying,
    license_number character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    cop character varying,
    address text
);


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    category text,
    unit text DEFAULT 'unidad'::text NOT NULL,
    sku text,
    current_stock numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    min_stock numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    unit_cost numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    item_id uuid NOT NULL,
    type character varying(10) NOT NULL,
    quantity numeric(12,2) NOT NULL,
    unit_cost numeric(10,2),
    reason text,
    doctor_id uuid,
    treatment_id uuid,
    treatment_session_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: odontogramas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.odontogramas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    clinical_history_id uuid,
    fecha date NOT NULL,
    teeth_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    especificaciones text,
    observaciones text,
    tipo character varying DEFAULT 'INICIAL'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tooth_observations jsonb DEFAULT '{}'::jsonb,
    plan_tratamiento text
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    birth_date date,
    gender character varying,
    phone character varying,
    email character varying,
    address text,
    observations text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    dni character varying,
    procedencia character varying,
    ocupacion character varying,
    emergencia_contacto text,
    distrito character varying,
    grado_instruccion character varying,
    nombre_madre character varying,
    ocupacion_madre character varying,
    telefono_madre character varying,
    nombre_padre character varying,
    ocupacion_padre character varying,
    telefono_padre character varying,
    alergias text,
    enfermedades text,
    deleted_at timestamp without time zone
);


--
-- Name: treatment_catalog_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_catalog_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    category character varying DEFAULT 'ADULTO'::character varying NOT NULL,
    price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: treatment_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    treatment_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    payment_doctor_id uuid,
    appointment_id uuid,
    session_date date NOT NULL,
    procedure_done text NOT NULL,
    teeth_treated text[] DEFAULT '{}'::text[] NOT NULL,
    amount_charged numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    amount_paid numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    payment_method character varying(20)
);


--
-- Name: treatments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    clinical_history_id uuid,
    type text NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date,
    teeth_affected text[] DEFAULT '{}'::text[] NOT NULL,
    cost numeric(10,2) DEFAULT 0 NOT NULL,
    paid numeric(10,2) DEFAULT 0 NOT NULL,
    progress smallint DEFAULT 0 NOT NULL,
    status character varying DEFAULT 'PROGRAMADO'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    total_sessions integer DEFAULT 1 NOT NULL,
    sessions_done integer DEFAULT 0 NOT NULL,
    requires_laboratory boolean DEFAULT false NOT NULL,
    laboratory_notes text,
    laboratory_cost numeric(10,2) DEFAULT 0 NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    role character varying DEFAULT 'DOCTOR'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: clinical_history_files PK_0150822c2f7e3b16e95c97fecae; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history_files
    ADD CONSTRAINT "PK_0150822c2f7e3b16e95c97fecae" PRIMARY KEY (id);


--
-- Name: appointments PK_4a437a9a27e948726b8bb3e36ad; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: doctors PK_8207e7889b50ee3695c2b8154ff; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT "PK_8207e7889b50ee3695c2b8154ff" PRIMARY KEY (id);


--
-- Name: treatment_catalog_items PK_8818d74b21029a6f40a0a456526; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_catalog_items
    ADD CONSTRAINT "PK_8818d74b21029a6f40a0a456526" PRIMARY KEY (id);


--
-- Name: budgets PK_9c8a51748f82387644b773da482; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY (id);


--
-- Name: budget_items PK_9eb705f406c83a1167ef575cd7f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT "PK_9eb705f406c83a1167ef575cd7f" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: patients PK_a7f0b9fcbb3469d5ec0b0aceaa7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY (id);


--
-- Name: clinic_settings PK_b0c4cdd69fc13bd7961fa44e6a7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_settings
    ADD CONSTRAINT "PK_b0c4cdd69fc13bd7961fa44e6a7" PRIMARY KEY (id);


--
-- Name: inventory_items PK_cf2f451407242e132547ac19169; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY (id);


--
-- Name: clinical_histories PK_cfb9612b30d2167eee2db3ea3d7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "PK_cfb9612b30d2167eee2db3ea3d7" PRIMARY KEY (id);


--
-- Name: inventory_movements PK_d7597827c1dcffae889db3ab873; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY (id);


--
-- Name: treatment_sessions PK_f301891fd97dab91f2c0fe18614; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_sessions
    ADD CONSTRAINT "PK_f301891fd97dab91f2c0fe18614" PRIMARY KEY (id);


--
-- Name: doctors REL_653c27d1b10652eb0c7bbbc442; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT "REL_653c27d1b10652eb0c7bbbc442" UNIQUE (user_id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: clinical_history_entries clinical_history_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history_entries
    ADD CONSTRAINT clinical_history_entries_pkey PRIMARY KEY (id);


--
-- Name: odontogramas odontogramas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontogramas
    ADD CONSTRAINT odontogramas_pkey PRIMARY KEY (id);


--
-- Name: treatments treatments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_pkey PRIMARY KEY (id);


--
-- Name: idx_clinical_history_entries_history; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_history_entries_history ON public.clinical_history_entries USING btree (clinical_history_id, fecha);


--
-- Name: uq_clinical_history_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_clinical_history_patient ON public.clinical_histories USING btree (patient_id);


--
-- Name: uq_odontograma_ch; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_odontograma_ch ON public.odontogramas USING btree (clinical_history_id) WHERE (clinical_history_id IS NOT NULL);


--
-- Name: uq_odontograma_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_odontograma_patient ON public.odontogramas USING btree (patient_id);


--
-- Name: appointments trg_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: clinical_histories trg_clinical_histories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_clinical_histories_updated_at BEFORE UPDATE ON public.clinical_histories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: doctors trg_doctors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: inventory_items trg_inventory_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: inventory_movements trg_inventory_movements_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_inventory_movements_updated_at BEFORE UPDATE ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: odontogramas trg_odontogramas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_odontogramas_updated_at BEFORE UPDATE ON public.odontogramas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: patients trg_patients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: treatments trg_treatments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_treatments_updated_at BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: inventory_movements FK_054fc6b78f1d45b69271deee672; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "FK_054fc6b78f1d45b69271deee672" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;


--
-- Name: clinical_history_entries FK_06a67956533c8231ea29ce503fd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history_entries
    ADD CONSTRAINT "FK_06a67956533c8231ea29ce503fd" FOREIGN KEY (clinical_history_id) REFERENCES public.clinical_histories(id) ON DELETE CASCADE;


--
-- Name: odontogramas FK_0c19b9dc7c70dbd74698333cda6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontogramas
    ADD CONSTRAINT "FK_0c19b9dc7c70dbd74698333cda6" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: odontogramas FK_18224f793a3116237572a82d95f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontogramas
    ADD CONSTRAINT "FK_18224f793a3116237572a82d95f" FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: clinical_histories FK_2508eaf5fe13ff85b2ab985e6d0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "FK_2508eaf5fe13ff85b2ab985e6d0" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: appointments FK_3330f054416745deaa2cc130700; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "FK_3330f054416745deaa2cc130700" FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: treatment_sessions FK_3523606b56b2e98383d4237ef0e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_sessions
    ADD CONSTRAINT "FK_3523606b56b2e98383d4237ef0e" FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: treatment_sessions FK_3900e6158a5226d826c3add59ba; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_sessions
    ADD CONSTRAINT "FK_3900e6158a5226d826c3add59ba" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: treatments FK_3afd8e9468c47c3d49148ef61fb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT "FK_3afd8e9468c47c3d49148ef61fb" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: treatment_sessions FK_3e0811880bc6ca834676f1064b0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_sessions
    ADD CONSTRAINT "FK_3e0811880bc6ca834676f1064b0" FOREIGN KEY (treatment_id) REFERENCES public.treatments(id) ON DELETE CASCADE;


--
-- Name: budgets FK_40d658a4a9cb9a2a9fdc9ca5adc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "FK_40d658a4a9cb9a2a9fdc9ca5adc" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;


--
-- Name: budgets FK_4c8dcdfc493ce6540cb1d8b583f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "FK_4c8dcdfc493ce6540cb1d8b583f" FOREIGN KEY (clinical_history_id) REFERENCES public.clinical_histories(id) ON DELETE SET NULL;


--
-- Name: appointments FK_4cf26c3f972d014df5c68d503d2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "FK_4cf26c3f972d014df5c68d503d2" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;


--
-- Name: budgets FK_5a9a7556a68a5a04df85b66f4d6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "FK_5a9a7556a68a5a04df85b66f4d6" FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: odontogramas FK_5ffe4f45114f1f9764af155ce6a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontogramas
    ADD CONSTRAINT "FK_5ffe4f45114f1f9764af155ce6a" FOREIGN KEY (clinical_history_id) REFERENCES public.clinical_histories(id) ON DELETE SET NULL;


--
-- Name: treatments FK_60ed0993367628c4b7441733fee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT "FK_60ed0993367628c4b7441733fee" FOREIGN KEY (clinical_history_id) REFERENCES public.clinical_histories(id) ON DELETE SET NULL;


--
-- Name: doctors FK_653c27d1b10652eb0c7bbbc4427; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT "FK_653c27d1b10652eb0c7bbbc4427" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: budgets FK_a2cebb31d719e916ba3db076bfe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "FK_a2cebb31d719e916ba3db076bfe" FOREIGN KEY (odontograma_id) REFERENCES public.odontogramas(id) ON DELETE SET NULL;


--
-- Name: inventory_movements FK_a59873b0b66f48c8bb3bda5ab69; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "FK_a59873b0b66f48c8bb3bda5ab69" FOREIGN KEY (treatment_id) REFERENCES public.treatments(id) ON DELETE SET NULL;


--
-- Name: clinical_history_entries FK_abcaa7889c1154a3b4ea2dea117; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history_entries
    ADD CONSTRAINT "FK_abcaa7889c1154a3b4ea2dea117" FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;


--
-- Name: clinical_histories FK_b130332f65c0d02b75e3399b9c8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_histories
    ADD CONSTRAINT "FK_b130332f65c0d02b75e3399b9c8" FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: treatment_sessions FK_b250583fec1e0858c5d773d733f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_sessions
    ADD CONSTRAINT "FK_b250583fec1e0858c5d773d733f" FOREIGN KEY (payment_doctor_id) REFERENCES public.doctors(id) ON DELETE SET NULL;


--
-- Name: inventory_movements FK_b674cf9ffa466350de3094bf598; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "FK_b674cf9ffa466350de3094bf598" FOREIGN KEY (treatment_session_id) REFERENCES public.treatment_sessions(id) ON DELETE SET NULL;


--
-- Name: budget_items FK_c3baf040ebaa2c35a6f5e0fe4d9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT "FK_c3baf040ebaa2c35a6f5e0fe4d9" FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE;


--
-- Name: inventory_movements FK_f28fdb1aa1d51974cfbf3ff52f8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "FK_f28fdb1aa1d51974cfbf3ff52f8" FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- Name: treatments FK_f63d122fc02fd144f49024e45dd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT "FK_f63d122fc02fd144f49024e45dd" FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: clinical_history_files FK_f6715282d6515edccd775c1959e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history_files
    ADD CONSTRAINT "FK_f6715282d6515edccd775c1959e" FOREIGN KEY (clinical_history_id) REFERENCES public.clinical_histories(id) ON DELETE CASCADE;


--
-- Name: budget_items FK_fe9a476fa992d2b31983b52ba9f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_items
    ADD CONSTRAINT "FK_fe9a476fa992d2b31983b52ba9f" FOREIGN KEY (treatment_catalog_item_id) REFERENCES public.treatment_catalog_items(id) ON DELETE SET NULL;


--
-- Fin del volcado de estructura
--

--
-- Índices de rendimiento
-- ----------------------
-- Van al final a propósito: no forman parte del volcado porque nunca llegaron a
-- crearse en la base de desarrollo (TypeORM `synchronize` crea tablas y claves,
-- no los índices declarados a mano en sql/tables/). Sobre una base pequeña no se
-- notan; sobre unos miles de tratamientos, los reportes sí.
--
-- Postgres NO indexa automáticamente las columnas de clave foránea, de ahí que
-- la mayoría de estos sean precisamente FKs.
--

SET search_path = public;

-- Autenticación y personal
CREATE INDEX IF NOT EXISTS idx_users_email               ON users(email);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id           ON doctors(user_id);

-- Pacientes. idx_patients_name indexa la misma expresión que usa la búsqueda;
-- si la consulta cambia de forma, el índice deja de aprovecharse.
CREATE INDEX IF NOT EXISTS idx_patients_name             ON patients(lower(first_name || ' ' || last_name));
CREATE INDEX IF NOT EXISTS idx_patients_email            ON patients(email);

-- Citas
CREATE INDEX IF NOT EXISTS idx_appointments_patient      ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor       ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date         ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status       ON appointments(status);

-- Historias clínicas
CREATE INDEX IF NOT EXISTS idx_clinical_histories_patient     ON clinical_histories(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_histories_doctor      ON clinical_histories(doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_histories_fecha       ON clinical_histories(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_history_files_history ON clinical_history_files(clinical_history_id);

-- Odontogramas
CREATE INDEX IF NOT EXISTS idx_odontogramas_patient          ON odontogramas(patient_id);
CREATE INDEX IF NOT EXISTS idx_odontogramas_doctor           ON odontogramas(doctor_id);
CREATE INDEX IF NOT EXISTS idx_odontogramas_clinical_history ON odontogramas(clinical_history_id);

-- Tratamientos. start_date y type son los ejes de los reportes por doctor:
-- todos filtran por rango de fechas y agrupan por tipo.
CREATE INDEX IF NOT EXISTS idx_treatments_patient          ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_doctor           ON treatments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatments_clinical_history ON treatments(clinical_history_id);
CREATE INDEX IF NOT EXISTS idx_treatments_status           ON treatments(status);
CREATE INDEX IF NOT EXISTS idx_treatments_start_date       ON treatments(start_date);
CREATE INDEX IF NOT EXISTS idx_treatments_type             ON treatments(type);

-- Sesiones de tratamiento. payment_doctor_id (quién cobró) es distinto de
-- doctor_id (quién atendió) y los reportes agrupan por ambos.
CREATE INDEX IF NOT EXISTS idx_sessions_treatment      ON treatment_sessions(treatment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_doctor         ON treatment_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_doctor ON treatment_sessions(payment_doctor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date           ON treatment_sessions(session_date);

-- Inventario
CREATE INDEX IF NOT EXISTS idx_inventory_items_name      ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category  ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inv_mov_item              ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_doctor            ON inventory_movements(doctor_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_treatment         ON inventory_movements(treatment_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_type              ON inventory_movements(type);

-- Notificaciones y presupuestos
CREATE INDEX IF NOT EXISTS idx_notifications_read     ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created  ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_patient        ON budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status         ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget    ON budget_items(budget_id);
