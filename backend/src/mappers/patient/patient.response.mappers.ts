import type {
  CaseDetailsResponseDTO,
  CreateAnesthesiaProcedureFormDTO,
  PatientDocumentResponseDTO,
  ReleasePatientDataResponseDTO,
} from "@petec/shared";
import type { ICase } from "@models/Case";
import type { IAnesthesiaForm } from "@models/AnesthesiaForm";
import type { IPatientDocument } from "@models/PatientDocument";
import {
  toDateInputString,
  toIsoDateString,
  toMapperIdString,
  toMapperNamedReference,
} from "@mappers/common/common.mappers.utils";
import {
  groupCaseDetailsRows,
  isPopulatedPatient,
  mapGridRowToDto,
  resolveCaseRefs,
} from "./patient.response.mappers.utils";
import { toPatientPhotoUrl } from "@utils/patientPhoto.utils";
import type {
  CaseWithPopulatedPatient,
  MedWithPopulatedName,
} from "./patient.response.mappers.types";
import { PATIENT_ASSET_PATHS } from "./patient.mapper.constants";

export const toPatientDocumentResponseDTO = (
  doc: IPatientDocument,
): PatientDocumentResponseDTO => ({
  id: doc._id.toString(),
  patientId: doc.patientId.toString(),
  caseId: doc.caseId?.toString(),
  patientDocumentTypeId: doc.patientDocumentTypeId.toString(),
  fileName: doc.fileName,
  storageKey: doc.storageKey,
  uploadedByUserId: doc.uploadedByUserId?.toString(),
  uploadedAt: doc.uploadedAt.toISOString(),
});

export const toAnesthesiaFormDTO = (
  value: IAnesthesiaForm,
): CreateAnesthesiaProcedureFormDTO => ({
  caseId: value.caseId.toString(),
  ownerName: value.ownerName,
  name: value.name,
  date: value.date,
  signature: value.signature,
  plannedProcedure: value.plannedProcedure,
  priceEstimate: value.priceEstimate,
  isFastSinceMidnight: value.isFastSinceMidnight,
  isDistortionHistory: value.isDistortionHistory,
  isMedicationsSensitive: value.isMedicationsSensitive,
  isNeedToMarkEar: value.isNeedToMarkEar,
  isSterilization: value.isSterilization,
  isPriceIncludesReleaseMedications: value.isPriceIncludesReleaseMedications,
  generalComments: value.generalComments,
  distortionComments: value.distortionComments,
  medicationsSensitiveComments: value.medicationsSensitiveComments,
});

export const toCaseDetailsResponseDTO = (
  caseData: CaseWithPopulatedPatient,
): CaseDetailsResponseDTO => {
  const patient = isPopulatedPatient(caseData.patientId)
    ? caseData.patientId
    : undefined;
  const refs = resolveCaseRefs(caseData.refs, patient);
  const photoName =
    toPatientPhotoUrl(
      patient?._id ? String(patient._id) : undefined,
      patient?.photoName,
      patient?.updatedAt,
    ) ?? PATIENT_ASSET_PATHS.DEFAULT_PATIENT_IMAGE;

  const gridRows = Array.isArray(caseData.caseDetailsGrid)
    ? caseData.caseDetailsGrid
    : [];
  const grouped = groupCaseDetailsRows(gridRows);

  const caseDailyDetails =
    grouped.length > 0
      ? grouped.map((group) => group.map(mapGridRowToDto))
      : null;

  return {
    caseDetails: {
      name: patient?.name ?? "",
      owner_name: patient?.owner?.name ?? "",
      owner_phone_number: patient?.owner?.phone ?? "",
      referring_doctor: caseData.admission?.referringDoctor ?? null,
      comments: caseData.comments ?? "",
      hospitalization_reason: caseData.admission?.hospitalizationReason ?? "",
      allergic_comments: caseData.admission?.allergicComments ?? null,
      weight_kg: caseData.patientSnapshot?.weightKg ?? null,
      age_years: caseData.patientSnapshot?.ageYears ?? null,
      age_months: caseData.patientSnapshot?.ageMonths ?? null,
      catheter_date_for_input:
        toDateInputString(caseData.dates?.catheterDate) ?? null,
      procedure_date_for_input:
        toDateInputString(caseData.dates?.procedureDate) ?? null,
      blood_test_link: caseData.admission?.bloodTestLink ?? null,
      is_archived: caseData.isArchived,

      gender_type_id: toMapperIdString(refs.genderTypeId),
      animal_type_id: toMapperIdString(refs.animalTypeId),
      animal_color_id: toMapperIdString(refs.animalColorId),
      insurance_id: toMapperIdString(refs.insuranceTypeId),
      food_type_id: toMapperIdString(refs.foodTypeId),
      race_id: toMapperIdString(refs.raceTypeId),

      doctor_id: toMapperIdString(caseData.doctorUserId),
      nurse_id: toMapperIdString(caseData.nurseUserId),

      is_convenia: caseData.flags?.isConvenia ?? false,
      is_allergic: caseData.flags?.isAllergic ?? false,
      is_escape_potential: caseData.flags?.isEscapePotential ?? false,
      is_npo: caseData.flags?.isNPO ?? false,
      is_risk_anesthesia: caseData.flags?.isRiskAnesthesia ?? false,
      is_heart_murmur: caseData.flags?.isHeartMurmur ?? false,
      is_amb: caseData.flags?.isAMB ?? false,
      is_aggressive: caseData.flags?.isAggressive ?? false,
      is_cerenia: caseData.flags?.isCerenia ?? false,
      is_procedure: caseData.flags?.isProcedure ?? false,

      is_released: Boolean(caseData.releaseDate),
      photo_name: photoName,
      patient_id: toMapperIdString(patient?._id),

      serial_id: caseData.serialId,
    },
    caseDailyDetails,
    masterCaseDetails: [],
  };
};

export const withMasterCaseDetails = (
  response: CaseDetailsResponseDTO,
  masterCaseDetails: CaseDetailsResponseDTO["masterCaseDetails"],
): CaseDetailsResponseDTO => ({
  ...response,
  masterCaseDetails,
});

export const toReleasePatientDataResponseDTO = (
  caseData: Pick<ICase, "releaseDate" | "dates">,
  meds: MedWithPopulatedName[],
): ReleasePatientDataResponseDTO => ({
  releaseDate: toIsoDateString(caseData.releaseDate) ?? null,
  stitchesRemovalDate:
    toIsoDateString(caseData.dates?.stitchesRemovalDate) ?? null,
  nextInspectionDate:
    toIsoDateString(caseData.dates?.nextInspectionDate) ?? null,
  medicines: meds.map((med) => {
    const medicineInfo = toMapperNamedReference(med.medicineId);
    const measureUnitInfo = toMapperNamedReference(med.measureUnitTypeId);
    const frequencyInfo = toMapperNamedReference(med.dosageFrequencyId);
    const routeInfo = toMapperNamedReference(med.routeOfAdministrationId);

    return {
      value: medicineInfo.id,
      text: medicineInfo.name,
      measureUnitId: measureUnitInfo.id,
      measureUnitText: measureUnitInfo.name,
      frequencyId: frequencyInfo.id,
      frequencyText: frequencyInfo.name,
      doseAmount:
        typeof med.doseAmount === "number"
          ? med.doseAmount
          : Number(med.doseAmount ?? 0),
      medicineRouteId: routeInfo.id,
      medicineRouteText: routeInfo.name,
      rangeMax: 0,
      rangeMin: 0,
      totalDose: 0,
      comments: med.notes ?? "",
      defaultMedicineRouteId: routeInfo.id || null,
      defaultFrequencyId: frequencyInfo.id || null,
    };
  }),
});
