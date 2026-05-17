import type {
  ReleasePatientDTO,
  ReleasePatientDataResponseDTO,
} from "@petec/shared";
import type { MedicineSelectOptionObj } from "../../MedicinePicker/MedicinePicker.types";

const RELEASE_DATE_FIELD_NAMES = [
  "releaseDate",
  "stitchesRemovalDate",
  "nextInspectionDate",
] as const;

export type ReleaseDateFieldName = (typeof RELEASE_DATE_FIELD_NAMES)[number];

export const isReleaseDateFieldName = (
  value: string,
): value is ReleaseDateFieldName =>
  RELEASE_DATE_FIELD_NAMES.includes(value as ReleaseDateFieldName);

export const normalizeReleaseDateInputValue = (
  value: string | Date | null,
): string | null => {
  if (value === null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return value;
};

export const mapReleaseResponseMedicines = (
  medicines: ReleasePatientDataResponseDTO["medicines"],
): MedicineSelectOptionObj[] =>
  medicines.map((medicine) => ({
    value: medicine.value,
    text: medicine.text,
    measureUnitTypeId: medicine.measureUnitTypeId,
    measureUnitText: medicine.measureUnitText,
    dosageFrequencyId: medicine.dosageFrequencyId,
    frequencyText: medicine.frequencyText,
    doseAmount: medicine.doseAmount,
    routeOfAdministrationId: medicine.routeOfAdministrationId,
    medicineRouteText: medicine.medicineRouteText,
    rangeMax: medicine.rangeMax,
    rangeMin: medicine.rangeMin,
    totalDose: medicine.totalDose,
    comments: medicine.comments,
  }));

export const mapSelectedMedicinesToReleaseMedicines = (
  selectedMedicines: MedicineSelectOptionObj[],
): ReleasePatientDTO["medicines"] =>
  selectedMedicines.map((medicine) => ({
    medicineId: String(medicine.value),
    measureUnitTypeId: medicine.measureUnitTypeId
      ? String(medicine.measureUnitTypeId)
      : undefined,
    dosageFrequencyId: medicine.dosageFrequencyId
      ? String(medicine.dosageFrequencyId)
      : undefined,
    routeOfAdministrationId: medicine.routeOfAdministrationId
      ? String(medicine.routeOfAdministrationId)
      : undefined,
    doseAmount: medicine.doseAmount,
    notes: medicine.comments ? String(medicine.comments) : undefined,
  }));
