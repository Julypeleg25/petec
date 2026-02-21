import type { SimpleSystemTypeDTO } from "@petec/shared";
import { useState, useEffect } from "react";
import { systemTypesApi } from "../../../features/system-management/system-types.api";
import { medicineApi } from "../../../features/medicine/medicine.api";
import type { SelectOptionObj } from "../../../utils/FormSelect/FormSelect.types";
import { MedicineSelectOptionObj } from "../../MedicinePicker/MedicinePicker.types";
import { MedicineDTO, AnimalVitalDTO } from "@petec/shared";
import { AnimalVitals } from "./CaseDetailsTable.types";
import {
    CASE_DETAIL_SYSTEM_TYPES,
    DEFAULT_NUMERIC_VALUE,
    EMPTY_SELECT_VALUE,
    INITIAL_VITALS,
    MEDICINE_CATEGORY_IDS,
    VITAL_NAMES,
} from "./useCaseDetailsData.constants";

export function useCaseDetailsData(animalId: number) {
    const [fecesTypes, setFecesTypes] = useState<SelectOptionObj[]>([]);
    const [urineTypes, setUrineTypes] = useState<SelectOptionObj[]>([]);
    const [medicines, setMedicines] = useState<MedicineSelectOptionObj[]>([]);
    const [fluids, setFluids] = useState<MedicineSelectOptionObj[]>([]);
    const [fluidsExtras, setFluidsExtras] = useState<MedicineSelectOptionObj[]>([]);
    const [animalVitals, setAnimalVitals] = useState<AnimalVitals>(INITIAL_VITALS);

    const getAnimalVitalsByAnimalId = async () => {
        try {
            const vitalsArr = await systemTypesApi.getAnimalVitalsByAnimal(String(animalId));
            if (vitalsArr.length > 0) {
                setAnimalVitals({
                    tempRangeMax: vitalsArr.find((item: AnimalVitalDTO) => item.name === VITAL_NAMES.TEMP)?.maxValue,
                    tempRangeMin: vitalsArr.find((item: AnimalVitalDTO) => item.name === VITAL_NAMES.TEMP)?.minValue,
                    pulseRangeMax: vitalsArr.find((item: AnimalVitalDTO) => item.name === VITAL_NAMES.PULSE)?.maxValue,
                    pulseRangeMin: vitalsArr.find((item: AnimalVitalDTO) => item.name === VITAL_NAMES.PULSE)?.minValue,
                    respirationRangeMax: vitalsArr.find((item: AnimalVitalDTO) => item.name === VITAL_NAMES.RESPIRATION)?.maxValue,
                    respirationRangeMin: vitalsArr.find((item: AnimalVitalDTO) => item.name === VITAL_NAMES.RESPIRATION)?.minValue,
                });
            }
        } catch {
        }
    };

    const getFecesTypes = async () => {
        try {
            const data = await systemTypesApi.getActive(CASE_DETAIL_SYSTEM_TYPES.FECES);
            setFecesTypes(data.map((t: SimpleSystemTypeDTO) => ({ value: t.id, text: t.name })));
        } catch {
        }
    };

    const getUrineTypes = async () => {
        try {
            const data = await systemTypesApi.getActive(CASE_DETAIL_SYSTEM_TYPES.URINE);
            setUrineTypes(data.map((t: SimpleSystemTypeDTO) => ({ value: t.id, text: t.name })));
        } catch {
        }
    };

    const getMedicineSelectOptionObj = (medicine: MedicineDTO): MedicineSelectOptionObj => {
        return {
            value: medicine.id,
            text: medicine.name,
            measureUnitId: medicine.measureUnitId ? medicine.measureUnitId._id : EMPTY_SELECT_VALUE,
            measureUnitText: medicine.measureUnitId ? medicine.measureUnitId.name : medicine.defaultUnit || EMPTY_SELECT_VALUE,
            frequencyId: medicine.dosageFrequencyId ? medicine.dosageFrequencyId._id : EMPTY_SELECT_VALUE,
            frequencyText: EMPTY_SELECT_VALUE,
            doseAmount: DEFAULT_NUMERIC_VALUE,
            medicineRouteId: medicine.routeOfAdministrationId ? medicine.routeOfAdministrationId._id : EMPTY_SELECT_VALUE,
            medicineRouteText: EMPTY_SELECT_VALUE,
            rangeMax: medicine.rangeMax !== null && medicine.rangeMax !== undefined ? Number(medicine.rangeMax) : DEFAULT_NUMERIC_VALUE,
            rangeMin: medicine.rangeMin !== null && medicine.rangeMin !== undefined ? Number(medicine.rangeMin) : DEFAULT_NUMERIC_VALUE,
            totalDose: medicine.totalDose !== null && medicine.totalDose !== undefined ? Number(medicine.totalDose) : DEFAULT_NUMERIC_VALUE,
            comments: medicine.comments || EMPTY_SELECT_VALUE,
            defaultMedicineRouteId: medicine.routeOfAdministrationId ? medicine.routeOfAdministrationId._id : null,
            defaultFrequencyId: medicine.dosageFrequencyId ? medicine.dosageFrequencyId._id : null,
        };
    };

    const getMedicinesByCategoryType = async (categoryId: string) => {
        return medicineApi.getAllByCategoryType(categoryId);
    };

    const getMedicines = async () => {
        getMedicinesByCategoryType(MEDICINE_CATEGORY_IDS.MEDICINE).then((data) => {
            setMedicines(data.map((medicine) => getMedicineSelectOptionObj(medicine)));
        });
    };

    const getFluids = async () => {
        getMedicinesByCategoryType(MEDICINE_CATEGORY_IDS.FLUID).then((data) => {
            setFluids(data.map((fluid) => getMedicineSelectOptionObj(fluid)));
        });
    };

    const getFluidsExtras = async () => {
        getMedicinesByCategoryType(MEDICINE_CATEGORY_IDS.FLUID_EXTRA).then((data) => {
            setFluidsExtras(data.map((fluidsExtra) => getMedicineSelectOptionObj(fluidsExtra)));
        });
    };

    useEffect(() => {
        getFecesTypes();
        getUrineTypes();
        getMedicines();
        getFluids();
        getFluidsExtras();
        getAnimalVitalsByAnimalId();
    }, []);

    return {
        fecesTypes,
        urineTypes,
        medicines,
        fluids,
        fluidsExtras,
        animalVitals,
    };
}
