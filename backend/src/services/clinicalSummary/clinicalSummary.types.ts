export interface ClinicalSummaryInput {
  patient: {
    species?: string;
    breed?: string;
    age?: string;
    sex?: string;
    weightKg?: number;
  };
  hospitalization: {
    admittedAt?: string;
    reason?: string;
    relevantBackground?: string[];
  };
  currentStatus: {
    diagnosesRecordedInChart?: string[];
    observations?: string[];
    latestExamination?: string;
  };
  vitalSigns: Array<{
    recordedAt: string;
    temperatureC?: number;
    heartRate?: number;
    respiratoryRate?: number;
  }>;
  treatments: Array<{
    name: string;
    dosage?: string;
    route?: string;
    frequency?: string;
    administrationStatus: "received" | "not_received_yet";
    scheduledAt: string;
  }>;
  alerts: {
    allergies?: string[];
    anesthesiaRisks?: string[];
    other?: string[];
  };
  pendingItems: string[];
  sourceMetadata: {
    recordUpdatedAt: string;
    inputWasTruncated: boolean;
  };
}

export type ClinicalSummaryFailureCategory =
  | "disabled"
  | "missing_key"
  | "not_found"
  | "empty_record"
  | "input_too_large"
  | "timeout"
  | "rate_limit"
  | "provider"
  | "invalid_output"
  | "duplicate_request"
  | "internal";
