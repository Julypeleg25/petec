import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type {
  CaseDetailsInputStateParams,
  CaseDetailsMedicineItem,
  CaseDetailsStateParams,
  CaseDetailsStateParamsCandidate,
} from "../CaseDetailsTable.types";
import { parseCaseGridHour } from "../caseGrid.utils";

export const toCaseDetailsMedicineCell = (
  medicine: MedicineSelectOptionObj,
): CaseDetailsMedicineItem => {
  const measureUnitTypeId = medicine.measureUnitTypeId
    ? String(medicine.measureUnitTypeId)
    : null;
  const dosageFrequencyId = medicine.dosageFrequencyId
    ? String(medicine.dosageFrequencyId)
    : null;
  const routeOfAdministrationId = medicine.routeOfAdministrationId
    ? String(medicine.routeOfAdministrationId)
    : null;

  return {
    medicineId: String(medicine.value),
    value: String(medicine.value),
    text: medicine.text,
    isGiven: false,
    isRequired: false,
    isEditable: true,
    dosageText: medicine.dosageText ?? null,
    doseAmount: medicine.doseAmount,
    measureUnitTypeId,
    dosageFrequencyId,
    routeOfAdministrationId,
    ...(medicine.measureUnitText
      ? { measureUnitText: medicine.measureUnitText }
      : {}),
    ...(medicine.frequencyText
      ? { frequencyText: medicine.frequencyText }
      : {}),
    ...(medicine.medicineRouteText
      ? { medicineRouteText: medicine.medicineRouteText }
      : {}),
    ...(medicine.rangeMax !== undefined ? { rangeMax: medicine.rangeMax } : {}),
    ...(medicine.rangeMin !== undefined ? { rangeMin: medicine.rangeMin } : {}),
    ...(medicine.totalDose !== undefined
      ? { totalDose: medicine.totalDose }
      : {}),
    ...(medicine.comments ? { medicineComments: medicine.comments } : {}),
    ...(medicine.suggestionReference
      ? { suggestionReference: medicine.suggestionReference }
      : {}),
  };
};

const toMedicineCatalogKey = (
  medicine: Pick<CaseDetailsMedicineItem, "medicineId" | "value">,
): string => String(medicine.medicineId ?? medicine.value);

export const hydrateCaseDetailsMedicineCell = (
  medicine: CaseDetailsMedicineItem,
  medicineCatalog: MedicineSelectOptionObj[],
): CaseDetailsMedicineItem => {
  const catalogMedicine = medicineCatalog.find(
    (item) => String(item.value) === toMedicineCatalogKey(medicine),
  );

  if (!catalogMedicine) {
    return medicine;
  }

  return {
    ...medicine,
    measureUnitTypeId:
      medicine.measureUnitTypeId ??
      (catalogMedicine.measureUnitTypeId
        ? String(catalogMedicine.measureUnitTypeId)
        : null),
    measureUnitText:
      medicine.measureUnitText || catalogMedicine.measureUnitText || "",
    dosageFrequencyId:
      medicine.dosageFrequencyId ??
      (catalogMedicine.dosageFrequencyId
        ? String(catalogMedicine.dosageFrequencyId)
        : null),
    frequencyText:
      medicine.frequencyText || catalogMedicine.frequencyText || "",
    routeOfAdministrationId:
      medicine.routeOfAdministrationId ??
      (catalogMedicine.routeOfAdministrationId
        ? String(catalogMedicine.routeOfAdministrationId)
        : null),
    medicineRouteText:
      medicine.medicineRouteText || catalogMedicine.medicineRouteText || "",
    rangeMax:
      medicine.rangeMax !== undefined
        ? medicine.rangeMax
        : catalogMedicine.rangeMax,
    rangeMin:
      medicine.rangeMin !== undefined
        ? medicine.rangeMin
        : catalogMedicine.rangeMin,
    totalDose:
      medicine.totalDose !== undefined
        ? medicine.totalDose
        : catalogMedicine.totalDose,
    medicineComments:
      medicine.medicineComments ?? catalogMedicine.comments ?? "",
  };
};

export const toMedicineSelectOption = (
  medicine: CaseDetailsMedicineItem,
): MedicineSelectOptionObj => ({
  value: medicine.value,
  text: medicine.text,
  measureUnitTypeId: medicine.measureUnitTypeId ?? "",
  measureUnitText: medicine.measureUnitText ?? "",
  dosageFrequencyId: medicine.dosageFrequencyId ?? "",
  frequencyText: medicine.frequencyText ?? "",
  doseAmount:
    medicine.doseAmount === null ||
    medicine.doseAmount === undefined ||
    medicine.doseAmount === ""
      ? undefined
      : typeof medicine.doseAmount === "number"
        ? medicine.doseAmount
        : Number(medicine.doseAmount),
  routeOfAdministrationId: medicine.routeOfAdministrationId ?? "",
  medicineRouteText: medicine.medicineRouteText ?? "",
  rangeMax: medicine.rangeMax,
  rangeMin: medicine.rangeMin,
  totalDose: medicine.totalDose,
  comments: medicine.medicineComments ?? "",
  dosageText: medicine.dosageText ?? undefined,
  suggestionReference: medicine.suggestionReference,
});

export const isCaseDetailsStateParams = (
  value?: CaseDetailsInputStateParams,
): value is CaseDetailsStateParams =>
  typeof value === "object" &&
  value !== null &&
  "index" in value &&
  typeof (value as CaseDetailsStateParamsCandidate).index === "number";

export const toTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseHourOption = (value: string): number | null => {
  const parsed = parseCaseGridHour(value);
  if (parsed !== null) {
    return parsed;
  }

  if (!value) return null;
  const parsedHour = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedHour) || parsedHour < 0 || parsedHour > 23) {
    return null;
  }

  return parsedHour;
};
