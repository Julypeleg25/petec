import { NotFoundError } from "../../constants/error.constants.js";
import { caseRepository } from "../../repositories/patient/case.repository.js";
import { patientRepository } from "../../repositories/patient/patient.repository.js";
import type { ICase, ICaseDetailsRow } from "../../models/case/index.js";
import type { PatientSuggestionContext } from "./caseSuggestion.types.js";

const toId = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
};

const collectItemIds = <T>(
  rows: readonly ICaseDetailsRow[],
  getItems: (row: ICaseDetailsRow) => readonly T[],
  getId: (item: T) => unknown,
): ReadonlySet<string> =>
  new Set(
    rows.flatMap((row) =>
      getItems(row)
        .map((item) => toId(getId(item)))
        .filter((id): id is string => Boolean(id)),
    ),
  );

const getLatestVitals = (
  rows: readonly ICaseDetailsRow[],
): PatientSuggestionContext["latestVitals"] => {
  let temperature: number | undefined;
  let pulse: number | undefined;
  let respiration: number | undefined;

  for (const row of [...rows].sort(
    (left, right) => right.dateTime.getTime() - left.dateTime.getTime(),
  )) {
    temperature ??=
      typeof row.temperature === "number" ? row.temperature : undefined;
    pulse ??= typeof row.pulse === "number" ? row.pulse : undefined;
    respiration ??=
      typeof row.respiration === "number" ? row.respiration : undefined;
    if (
      temperature !== undefined &&
      pulse !== undefined &&
      respiration !== undefined
    ) {
      break;
    }
  }

  return {
    ...(temperature !== undefined ? { temperature } : {}),
    ...(pulse !== undefined ? { pulse } : {}),
    ...(respiration !== undefined ? { respiration } : {}),
  };
};

const toAgeMonths = (
  snapshot: ICase["patientSnapshot"],
): number | undefined => {
  const years = snapshot.ageYears;
  const months = snapshot.ageMonths;
  if (years === undefined && months === undefined) return undefined;
  return (years ?? 0) * 12 + (months ?? 0);
};

export class CaseSuggestionContextService {
  async build(patientId: string): Promise<PatientSuggestionContext> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }

    const cases = await caseRepository.findByPatientId(patient._id);
    const currentCase = cases.find((item) => !item.isArchived) ?? cases[0];
    if (!currentCase) {
      throw new NotFoundError("Patient case not found");
    }

    const rows = currentCase.caseDetailsGrid ?? [];
    const animalTypeId = toId(currentCase.refs.animalTypeId);
    const breedId = toId(currentCase.refs.raceTypeId);
    const genderId = toId(currentCase.refs.genderTypeId);
    const ageMonths = toAgeMonths(currentCase.patientSnapshot);
    const allergyStatus =
      currentCase.flags.isAllergic === true
        ? "present"
        : currentCase.flags.isAllergic === false
          ? "absent"
          : "unknown";

    return {
      patientId: patient._id.toString(),
      caseId: currentCase._id.toString(),
      patientDataVersion: currentCase.updatedAt.toISOString(),
      ...(animalTypeId ? { animalTypeId } : {}),
      ...(breedId ? { breedId } : {}),
      ...(genderId ? { genderId } : {}),
      ...(ageMonths !== undefined ? { ageMonths } : {}),
      ...(currentCase.patientSnapshot.weightKg !== undefined
        ? { weightKg: currentCase.patientSnapshot.weightKg }
        : {}),
      ...(currentCase.admission.hospitalizationReason
        ? {
            hospitalizationReason: currentCase.admission.hospitalizationReason,
          }
        : {}),
      ...(currentCase.comments ? { comments: currentCase.comments } : {}),
      allergyStatus,
      ...(currentCase.admission.allergicComments
        ? { allergyDetails: currentCase.admission.allergicComments }
        : {}),
      flags: { ...currentCase.flags },
      activeMedicationIds: collectItemIds(
        rows,
        (row) => row.medicines,
        (item) => item.medicineId,
      ),
      activeFluidIds: collectItemIds(
        rows,
        (row) => row.fluids,
        (item) => item.medicineId,
      ),
      activeProcedureIds: collectItemIds(
        rows,
        (row) => row.procedures,
        (item) => item.typeId,
      ),
      pendingDiagnosticTestIds: collectItemIds(
        rows,
        (row) => row.examinations.filter((item) => !item.value),
        (item) => item.typeId,
      ),
      activeNutritionIds: collectItemIds(
        rows,
        (row) => row.foodExtras,
        (item) => item.typeId,
      ),
      latestVitals: getLatestVitals(rows),
    };
  }
}

export const caseSuggestionContextService = new CaseSuggestionContextService();
