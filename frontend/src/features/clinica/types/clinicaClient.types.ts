export interface ClinicaPet {
    externalPatientId?: string;
    name: string;
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
    medicalRecords?: ClinicaMedicalRecord[];
  }

  export interface ClinicaMedicalRecord {
    patientName?: string;
    recordType?: string;
    rawText?: string;
    table?: ClinicaVisitTable;
    syncedAt?: string;
  }

  export interface ClinicaVisitTable {
    headers: string[];
    rows: string[][];
  }

  export interface ClinicaClientRawData {
    recordsCount?: number;
    original?: {
      patient?: ClinicaPet;
      medicalRecords?: ClinicaMedicalRecord[];
    };
  }
  
  export interface ClinicaClient {
    _id: string;
    externalPatientId?: string;
    ownerName: string;
    ownerPhone: string;
    pets: ClinicaPet[];
    rawData?: ClinicaClientRawData;
    lastSyncedAt: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ClinicaClientsResponse {
    items: ClinicaClient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  export interface ClinicaSyncStatusResponse {
    isSyncRunning: boolean;
  }
  
  export interface ClinicaSyncResult {
    totalFromClinica: number;
    created: number;
    updated: number;
    skipped: number;
    syncedAt: string;
  }
