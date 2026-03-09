import type { MedicineDTO } from "@petec/shared";
import type { MedicineSelectOptionObj } from "../../../components/MedicinePicker/MedicinePicker.types";

export const mapMedicineDtoToSelectOption = (
    medicine: MedicineDTO,
): MedicineSelectOptionObj => ({
    value: medicine.id,
    text: medicine.name,
    measureUnitTypeId: medicine.measureUnitType?.id ?? "",
    measureUnitText: medicine.measureUnitType?.name ?? medicine.defaultUnit ?? "",
    dosageFrequencyId: medicine.dosageFrequency?.id ?? "",
    frequencyText: medicine.dosageFrequency?.name ?? "",
    doseAmount:
        typeof medicine.totalDose === "number" ? medicine.totalDose : undefined,
    routeOfAdministrationId: medicine.routeOfAdministration?.id ?? "",
    medicineRouteText: medicine.routeOfAdministration?.name ?? "",
    rangeMax: medicine.rangeMax ?? undefined,
    rangeMin: medicine.rangeMin ?? undefined,
    totalDose: medicine.totalDose ?? undefined,
    comments: medicine.comments ?? "",
});
