export const PATIENT_EXPORT_FILE_BASENAME = "patientCase";
export const PATIENT_EXPORT_FILE_EXTENSION = ".pdf";
export const DEFAULT_PATIENT_EXPORT_FILE_NAME =
  `${PATIENT_EXPORT_FILE_BASENAME}_${PATIENT_EXPORT_FILE_EXTENSION}`;

export const buildPatientExportFileName = (
  serialId?: string | null,
): string => {
  const normalizedSerialId = serialId?.trim();

  if (!normalizedSerialId) {
    return DEFAULT_PATIENT_EXPORT_FILE_NAME;
  }

  return `${PATIENT_EXPORT_FILE_BASENAME}_${normalizedSerialId}${PATIENT_EXPORT_FILE_EXTENSION}`;
};
