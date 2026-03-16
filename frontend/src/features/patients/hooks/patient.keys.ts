export const patientKeys = {
  all: ["patients"] as const,
  case: (masterCaseId: string, caseId: string) =>
    ["patients", "case", masterCaseId, caseId] as const,
  documents: (caseId: string) => ["patients", "documents", caseId] as const,
  anesthesia: (caseId: string) => ["patients", "anesthesia", caseId] as const,
  releaseData: (caseId: string) => ["patients", "releaseData", caseId] as const,
  charts: (caseId: string) => ["patients", "charts", caseId] as const,
};
