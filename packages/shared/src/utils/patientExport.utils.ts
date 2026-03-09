export const buildPatientExportFileName = (
  serialId?: string | null,
): string => {
  const normalizedSerialId = serialId?.trim();

  if (!normalizedSerialId) {
    return "patientCase.pdf";
  }

  return `patientCase_${normalizedSerialId}.pdf`;
};
