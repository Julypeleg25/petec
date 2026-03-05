import { useCallback, useEffect, useState } from "react";
import { systemTypesApi } from "../../../../features/system-management/systemTypes.api";
import { medicineApi } from "../../../../features/medicine/medicine.api";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import type { AnimalVitals } from "../CaseDetailsTable.types";
import {
    CASE_DETAIL_SYSTEM_TYPES,
    INITIAL_VITALS,
    MEDICINE_CATEGORY_IDS,
} from "./useCaseDetailsData.constants";
import {
    mapAnimalVitals,
    mapMedicineToSelectOption,
    mapSystemTypeToSelectOption,
    resolveMedicineCategoryId,
} from "./useCaseDetailsData.utils";

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

    const getActiveTypeOptions = useCallback(async (typeName: typeof CASE_DETAIL_SYSTEM_TYPES[keyof typeof CASE_DETAIL_SYSTEM_TYPES]) => {
        try {
            return await systemTypesApi.getActive(typeName);
        } catch {
            return [];
        }
    }, []);

    const getMedicinesByCategoryType = useCallback(async (categoryId: string) => {
        try {
            const medicinesByCategory = await medicineApi.getAllByCategoryType(categoryId);
            if (medicinesByCategory.length > 0) {
                return medicinesByCategory;
            }

            const categories = await medicineApi.getAllCategoryTypes();
            const resolvedCategoryId = resolveMedicineCategoryId(categories, categoryId);
            if (!resolvedCategoryId || resolvedCategoryId === categoryId) {
                return medicinesByCategory;
            }

            return await medicineApi.getAllByCategoryType(resolvedCategoryId);
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
            getActiveTypeOptions(CASE_DETAIL_SYSTEM_TYPES.FECES),
            getActiveTypeOptions(CASE_DETAIL_SYSTEM_TYPES.URINE),
            getMedicinesByCategoryType(MEDICINE_CATEGORY_IDS.MEDICINE),
            getMedicinesByCategoryType(MEDICINE_CATEGORY_IDS.FLUID),
            getMedicinesByCategoryType(MEDICINE_CATEGORY_IDS.FLUID_EXTRA),
            getAnimalVitalsByAnimalId(),
        ]);

        setFecesTypes(fecesTypesResult.map(mapSystemTypeToSelectOption));
        setUrineTypes(urineTypesResult.map(mapSystemTypeToSelectOption));
        setMedicines(medicinesResult.map(mapMedicineToSelectOption));
        setFluids(fluidsResult.map(mapMedicineToSelectOption));
        setFluidsExtras(fluidsExtrasResult.map(mapMedicineToSelectOption));
    }, [
        getActiveTypeOptions,
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
