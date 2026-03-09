import { useCallback, useEffect, useState } from "react";
import { systemTypesApi } from "../../../../features/system-management/systemTypes.api";
import { medicineApi } from "../../../../features/medicine/medicine.api";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type { AnimalVitals } from "../CaseDetailsTable.types";
import { mapMedicineDtoToSelectOption } from "../../../../features/medicine/mappers/medicine.mappers";
import { mapSystemTypeToSelectOption } from "../../../../features/system-management/mappers/systemTypes.mappers";
import {
    CASE_DETAIL_SYSTEM_TYPES,
    type CaseDetailSystemType,
    INITIAL_VITALS,
    MEDICINE_CATEGORY_TYPES_FOR_CASE_DETAILS,
} from "./useCaseDetailsData.constants";
import {
    mapAnimalVitals,
} from "./useCaseDetailsData.utils";
import type { MedicineCategoryType } from "@petec/shared";

export function useCaseDetailsData(animalId: string) {
    const [fecesTypes, setFecesTypes] = useState<SelectOptionObj[]>([]);
    const [urineTypes, setUrineTypes] = useState<SelectOptionObj[]>([]);
    const [medicines, setMedicines] = useState<MedicineSelectOptionObj[]>([]);
    const [fluids, setFluids] = useState<MedicineSelectOptionObj[]>([]);
    const [fluidsExtras, setFluidsExtras] = useState<MedicineSelectOptionObj[]>([]);
    const [animalVitals, setAnimalVitals] = useState<AnimalVitals>(INITIAL_VITALS);

    const getAnimalVitalsByAnimalId = useCallback(async () => {
        if (!animalId) {
            setAnimalVitals(INITIAL_VITALS);
            return;
        }
        try {
            const vitalsArr = await systemTypesApi.getAnimalVitalsByAnimal(animalId);
            setAnimalVitals(mapAnimalVitals(vitalsArr));
        } catch {
            setAnimalVitals(INITIAL_VITALS);
        }
    }, [animalId]);

    const getTypeOptions = useCallback(async (typeName: CaseDetailSystemType) => {
        try {
            return await systemTypesApi.getAll(typeName);
        } catch {
            return [];
        }
    }, []);

    const getMedicinesByCategoryType = useCallback(async (categoryType: MedicineCategoryType) => {
        try {
            return await medicineApi.getAllByCategoryType(categoryType);
        } catch {
            return [];
        }
    }, []);

    const loadCaseDetailsData = useCallback(async () => {
        const [
            fecesTypesResult,
            urineTypesResult,
            medicinesResult,
            fluidsResult,
            fluidsExtrasResult,
        ] = await Promise.all([
            getTypeOptions(CASE_DETAIL_SYSTEM_TYPES.FECES),
            getTypeOptions(CASE_DETAIL_SYSTEM_TYPES.URINE),
            getMedicinesByCategoryType(MEDICINE_CATEGORY_TYPES_FOR_CASE_DETAILS.MEDICINE),
            getMedicinesByCategoryType(MEDICINE_CATEGORY_TYPES_FOR_CASE_DETAILS.FLUID),
            getMedicinesByCategoryType(MEDICINE_CATEGORY_TYPES_FOR_CASE_DETAILS.FLUID_EXTRA),
            getAnimalVitalsByAnimalId(),
        ]);

        setFecesTypes(fecesTypesResult.map(mapSystemTypeToSelectOption));
        setUrineTypes(urineTypesResult.map(mapSystemTypeToSelectOption));
        setMedicines(medicinesResult.map(mapMedicineDtoToSelectOption));
        setFluids(fluidsResult.map(mapMedicineDtoToSelectOption));
        setFluidsExtras(fluidsExtrasResult.map(mapMedicineDtoToSelectOption));
    }, [
        getTypeOptions,
        getAnimalVitalsByAnimalId,
        getMedicinesByCategoryType,
    ]);

    useEffect(() => {
        void loadCaseDetailsData();
    }, [loadCaseDetailsData]);

    return {
        fecesTypes,
        urineTypes,
        medicines,
        fluids,
        fluidsExtras,
        animalVitals,
    };
}
