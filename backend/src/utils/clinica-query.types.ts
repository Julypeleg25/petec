export interface ClinicaPatientDto {
  externalPatientId?: string;
  name: string;
  owner: {
    name: string;
    phone: string;
  };
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