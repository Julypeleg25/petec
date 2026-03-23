import {
  DEFAULT_PATIENT_IMAGE,
} from "@petec/shared";
import type {
  CaseDetailsResponseDTO,
  CreateAnesthesiaProcedureFormDTO,
  PatientDocumentResponseDTO,
  ReleasePatientDataResponseDTO,
} from "@petec/shared";
import type { ICase } from "../../models/case/index.js";
import type { IAnesthesiaForm } from "../../models/anesthesiaForm/index.js";
import type { IPatientDocument } from "../../models/patientDocument/index.js";
import {
  toDateInputString,
  toFiniteNumber,
  toIsoDateString,
  toMapperIdString,
  toMapperNamedReference,
  toOptionalBoolean,
  toOptionalString,
} from "../common/common.mappers.utils.js";
import {
  isPopulatedPatient,
  resolveCaseRefs,
} from "./patient.response.mappers.utils.js";
import {
  groupCaseDetailsRows,
  mapGridRowToDto,
} from "./patient.response.grid.mappers.js";
import { toPatientPhotoUrl } from "../../utils/patientPhoto.utils.js";
import type {
  CaseWithPopulatedPatient,
  MedWithPopulatedName,
  PopulatedMedicineRef,
} from "./patient.response.mappers.types.js";

export const toPatientDocumentResponseDTO = (
  doc: IPatientDocument,
): PatientDocumentResponseDTO => ({
  id: toMapperIdString(doc._id),
  patientId: toMapperIdString(doc.patientId),
  caseId: toMapperIdString(doc.caseId) || undefined,
  patientDocumentTypeId: toMapperIdString(doc.patientDocumentTypeId),
  fileName: doc.fileName,
  storageKey: doc.storageKey,
  fileUrl: doc.storageKey,
  uploadedByUserId: toMapperIdString(doc.uploadedByUserId) || undefined,
  uploadedAt: doc.uploadedAt.toISOString(),
});

export const toAnesthesiaFormDTO = (
  value: IAnesthesiaForm,
): CreateAnesthesiaProcedureFormDTO => ({
  caseId: toMapperIdString(value.caseId),
  ownerName: toOptionalString(value.ownerName),
  name: toOptionalString(value.name),
  date: value.date instanceof Date ? value.date : undefined,
  signature: toOptionalString(value.signature),
  plannedProcedure: toOptionalString(value.plannedProcedure),
  priceEstimate:
    typeof value.priceEstimate === "number" ||
      typeof value.priceEstimate === "string"
      ? value.priceEstimate
      : undefined,
  isFastSinceMidnight: toOptionalBoolean(value.isFastSinceMidnight),
  isDistortionHistory: toOptionalBoolean(value.isDistortionHistory),
  isMedicationsSensitive: toOptionalBoolean(value.isMedicationsSensitive),
  isNeedToMarkEar: toOptionalBoolean(value.isNeedToMarkEar),
  isSterilization: toOptionalBoolean(value.isSterilization),
  isPriceIncludesReleaseMedications: toOptionalBoolean(
    value.isPriceIncludesReleaseMedications,
  ),
  generalComments: toOptionalString(value.generalComments),
  distortionComments: toOptionalString(value.distortionComments),
  medicationsSensitiveComments: toOptionalString(
    value.medicationsSensitiveComments,
  ),
});

export const toCaseDetailsResponseDTO = (
  caseData: CaseWithPopulatedPatient,
): CaseDetailsResponseDTO => {
  const caseSerialId =
    typeof caseData.serialId === "string" && caseData.serialId.trim().length > 0
      ? caseData.serialId
      : toMapperIdString(caseData._id);
  const patient = isPopulatedPatient(caseData.patientId)
    ? caseData.patientId
    : undefined;
  const refs = resolveCaseRefs(caseData.refs, patient);
  const photoName =
    toPatientPhotoUrl(
      patient?._id ? String(patient._id) : undefined,
      patient?.photoName,
      patient?.updatedAt,
    ) ?? DEFAULT_PATIENT_IMAGE;

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

      serial_id: caseSerialId,
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

const toPopulatedMedicineRef = (
  value: MedWithPopulatedName["medicineId"],
): PopulatedMedicineRef | undefined => {
  if (typeof value !== "object" || value === null || !("_id" in value)) {
    return undefined;
  }

  return value as PopulatedMedicineRef;
};

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
    const populatedMedicine = toPopulatedMedicineRef(med.medicineId);
    const fallbackMeasureUnit = populatedMedicine?.measureUnitTypeId;
    const medicineInfo = toMapperNamedReference(med.medicineId);
    const measureUnitInfo = toMapperNamedReference(
      med.measureUnitTypeId ?? fallbackMeasureUnit,
    );
    const frequencyInfo = toMapperNamedReference(med.dosageFrequencyId);
    const routeInfo = toMapperNamedReference(med.routeOfAdministrationId);

    return {
      value: medicineInfo.id,
      text: medicineInfo.name,
      measureUnitTypeId: measureUnitInfo.id,
      measureUnitText: measureUnitInfo.name,
      dosageFrequencyId: frequencyInfo.id || null,
      frequencyText: frequencyInfo.name,
      doseAmount:
        typeof med.doseAmount === "number"
          ? med.doseAmount
          : Number(med.doseAmount ?? 0),
      routeOfAdministrationId: routeInfo.id || null,
      medicineRouteText: routeInfo.name,
      rangeMax: toFiniteNumber(populatedMedicine?.rangeMax) ?? 0,
      rangeMin: toFiniteNumber(populatedMedicine?.rangeMin) ?? 0,
      totalDose: toFiniteNumber(populatedMedicine?.totalDose) ?? 0,
      comments: populatedMedicine?.comments ?? med.notes ?? "",
    };
  }),
});
