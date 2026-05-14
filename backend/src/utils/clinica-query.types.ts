export interface ClinicaPatientDto {
  externalPatientId?: string;
  name: string;

  owner: {
    name: string;
    phone: string;
  };

  gender?: string;
  breed?: string;
  species?: string;
  color?: string;
  weightKg?: number;
  ageYears?: number;
  ageMonths?: number;
  insurance?: string;
  treatingDoctor?: string;
  referringDoctor?: string;
}

export interface ClinicaMedicalRecordDto {
  patientName: string;
  ownerName: string;
  ownerPhone: string;
  recordType: string;
  rawText: string;
  syncedAt: Date;
}

export interface ImportedClinicaAggregate {
  patient: ClinicaPatientDto;
  medicalRecords: ClinicaMedicalRecordDto[];
}