import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  // Filiación extra (Historia Clínica Odontológica – MINSA 2019)
  @Column({ nullable: true })
  dni: string;

  @Column({ nullable: true })
  procedencia: string;

  @Column({ nullable: true })
  ocupacion: string;

  @Column({ nullable: true })
  distrito: string;

  @Column({ name: 'grado_instruccion', nullable: true })
  gradoInstruccion: string;

  // Datos del apoderado (para pacientes menores de edad)
  @Column({ name: 'nombre_madre', nullable: true })
  nombreMadre: string;

  @Column({ name: 'ocupacion_madre', nullable: true })
  ocupacionMadre: string;

  @Column({ name: 'telefono_madre', nullable: true })
  telefonoMadre: string;

  @Column({ name: 'nombre_padre', nullable: true })
  nombrePadre: string;

  @Column({ name: 'ocupacion_padre', nullable: true })
  ocupacionPadre: string;

  @Column({ name: 'telefono_padre', nullable: true })
  telefonoPadre: string;

  // Alerta médica general del paciente
  @Column({ type: 'text', nullable: true })
  alergias: string;

  @Column({ type: 'text', nullable: true })
  enfermedades: string;

  @Column({ name: 'emergencia_contacto', type: 'text', nullable: true })
  emergenciaContacto: string;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Soft delete: TypeORM excluye automáticamente las filas con deleted_at.
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @OneToMany(() => Appointment, (a) => a.patient)
  appointments: Appointment[];
}
