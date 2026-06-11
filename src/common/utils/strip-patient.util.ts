import { Patient } from '../../modules/patients/entities/patient.entity';

// Fields visible to DOCTOR role (no personal data)
export const DOCTOR_VISIBLE_PATIENT_FIELDS: (keyof Patient)[] = [
  'id',
  'firstName',
  'lastName',
  'gender',
  'birthDate',
  'createdAt',
  'updatedAt',
];

export function stripPatientForDoctor(patient: Patient): Partial<Patient> {
  return DOCTOR_VISIBLE_PATIENT_FIELDS.reduce((acc, key) => {
    acc[key as string] = patient[key];
    return acc;
  }, {} as Partial<Patient>);
}
