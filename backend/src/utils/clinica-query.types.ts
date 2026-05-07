export interface ClinicaPatientDto {
  externalPatientId?: string;
  name: string;
  owner: {
    name: string;
    phone: string;
  };
}

export interface ImportedClinicaAggregate {
  patient: ClinicaPatientDto;
}