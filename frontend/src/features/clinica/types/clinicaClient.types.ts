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
    microchipNumber?: string;
    neutered?: boolean;
    notes?: string;
    rawData?: Record<string, unknown>;
    treatingDoctor?: string;
    referringDoctor?: string;
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
    visits?: ClinicaMedicalRecord[];
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
