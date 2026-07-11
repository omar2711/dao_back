import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

@Entity('clinical_histories')
export class ClinicalHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  // Número HC y fecha/hora
  @Column({ name: 'hc_number', nullable: true })
  hcNumber: string;

  // FILIACIÓN (movida desde el registro del paciente)
  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ nullable: true })
  distrito: string;

  @Column({ name: 'grado_instruccion', nullable: true })
  gradoInstruccion: string;

  @Column({ nullable: true })
  procedencia: string;

  @Column({ nullable: true })
  ocupacion: string;

  @Column({ name: 'emergencia_contacto', type: 'text', nullable: true })
  emergenciaContacto: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time', nullable: true })
  hora: string;

  // MOTIVO DE CONSULTA
  @Column({ name: 'motivo_consulta', type: 'text', nullable: true })
  motivoConsulta: string;

  // ENFERMEDAD ACTUAL
  @Column({ name: 'enfermedad_actual', type: 'text', nullable: true })
  enfermedadActual: string;

  @Column({ name: 'tiempo_enfermedad', type: 'text', nullable: true })
  tiempoEnfermedad: string;

  @Column({ name: 'signos_sintomas', type: 'text', nullable: true })
  signosSintomas: string;

  @Column({ name: 'relato_cronologico', type: 'text', nullable: true })
  relatoCronologico: string;

  @Column({ name: 'funciones_biologicas', type: 'text', nullable: true })
  funcionesBiologicas: string;

  // ANTECEDENTES
  @Column({ name: 'antecedentes_familiares', type: 'text', nullable: true })
  antecedentesFamiliares: string;

  @Column({ name: 'antecedentes_personales', type: 'text', nullable: true })
  antecedentesPersonales: string;

  @Column({ type: 'text', nullable: true })
  alergias: string;

  @Column({ type: 'text', nullable: true })
  enfermedades: string;

  @Column({ name: 'viajes_ultimo_anio', type: 'text', nullable: true })
  viajesUltimoAnio: string;

  // EXAMEN CLÍNICO – Signos Vitales
  @Column({ name: 'signos_vitales_pa', nullable: true })
  signosVitalesPa: string;

  @Column({ name: 'signos_vitales_pulso', nullable: true })
  signosVitalesPulso: string;

  @Column({ name: 'signos_vitales_temp', nullable: true })
  signosVitalesTemp: string;

  @Column({ name: 'signos_vitales_fc', nullable: true })
  signosVitalesFc: string;

  @Column({ name: 'signos_vitales_fr', nullable: true })
  signosVitalesFr: string;

  @Column({ name: 'examen_clinico_general', type: 'text', nullable: true })
  examenClinicoGeneral: string;

  @Column({ name: 'examen_clinico_odontoestomatologico', type: 'text', nullable: true })
  examenClinicoOdontostomatologico: string;

  // DIAGNÓSTICO (CIE 10)
  @Column({ name: 'diagnostico_presuntivo', type: 'text', nullable: true })
  diagnosticoPresuntivo: string;

  @Column({ name: 'diagnostico_definitivo', type: 'text', nullable: true })
  diagnosticoDefinitivo: string;

  // PLAN DE TRATAMIENTO
  @Column({ name: 'plan_tratamiento', type: 'text', nullable: true })
  planTratamiento: string;

  // PRONÓSTICO
  @Column({ type: 'text', nullable: true })
  pronostico: string;

  // TRATAMIENTO / RECOMENDACIONES
  @Column({ name: 'tratamiento_recomendaciones', type: 'text', nullable: true })
  tratamientoRecomendaciones: string;

  // CONTROL Y EVOLUCIÓN
  @Column({ name: 'control_evolucion', type: 'text', nullable: true })
  controlEvolucion: string;

  // ALTA DEL PACIENTE
  @Column({ name: 'alta_paciente', type: 'text', nullable: true })
  altaPaciente: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
