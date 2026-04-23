export interface ParsedClinicaQuery {
  searchText: string;
  includeTreatments: boolean;
}

export interface ClinicaPatientDto {
  externalPatientId?: string;
  name: string;
  owner: {
    name: string;
    phone: string;
  };
  photoName?: string;
}

export interface ClinicaTreatmentDto {
  externalTreatmentId?: string;
  treatmentDate?: string;
  type: string;
  description?: string;
}

export interface ImportedClinicaAggregate {
  patient: ClinicaPatientDto;
  treatments: ClinicaTreatmentDto[];
}