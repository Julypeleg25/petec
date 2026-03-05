import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { medicineApi } from "../../../features/medicine/medicine.api";
import { SelectOptionObj } from "../../../utils/FormSelect/FormSelect.types";
import { MedicineSelectOptionObj } from "../MedicinePicker.types";
import {
  hasDoseRange,
  hydrateSelectedMedicinesWithCatalog,
  isDoseAmountOutOfRecommendedRange,
  mapSimpleSystemTypesToSelectOptions,
} from "./useMedicinePicker.utils";

interface UseMedicinePickerParams {
  medicineList: MedicineSelectOptionObj[];
  selectedMedicinesList?: MedicineSelectOptionObj[];
  setStateSelectedMedicines?: React.Dispatch<
    React.SetStateAction<MedicineSelectOptionObj[]>
  >;
  animalWeight?: number;
}

export function useMedicinePicker({
  medicineList,
  selectedMedicinesList = [],
  setStateSelectedMedicines,
  animalWeight,
}: UseMedicinePickerParams) {
  const [
    medicinesRoutesForAdministration,
    setMedicinesRoutesForAdministration,
  ] = useState<SelectOptionObj[]>([]);
  const [medicinesFrequencies, setMedicinesFrequencies] = useState<
    SelectOptionObj[]
  >([]);
  const [selectedMedicines, setSelectedMedicines] = useState<
    MedicineSelectOptionObj[]
  >(selectedMedicinesList);
  const [selectedMedicine, setSelectedMedicine] =
    useState<MedicineSelectOptionObj>();
  const [doseAmount, setDoseAmount] = useState<number>();
  const [reloadRangeSlider, setReloadRangeSlider] = useState(false);

  useEffect(() => {
    setSelectedMedicines(
      hydrateSelectedMedicinesWithCatalog(selectedMedicinesList, medicineList),
    );
  }, [medicineList, selectedMedicinesList]);

  const getMedicinesRoutesForAdministration = async () => {
    try {
      const data = await medicineApi.getRoutesOfAdministration();
      setMedicinesRoutesForAdministration(
        mapSimpleSystemTypesToSelectOptions(data),
      );
    } catch {
      /* handled by interceptor */
    }
  };

  const getMedicinesFrequencies = async () => {
    try {
      const data = await medicineApi.getFrequencies();
      setMedicinesFrequencies(mapSimpleSystemTypesToSelectOptions(data));
    } catch {
      /* handled by interceptor */
    }
  };

  const addMedicine = (e: React.FormEvent) => {
    e.preventDefault();

    const medicineSelect = document.getElementById(
      "medicine-select",
    ) as HTMLSelectElement;
    const medicineRoutesForAdministrationSelect = document.getElementById(
      "medicine-routes-for-administration-select",
    ) as HTMLSelectElement;
    const medicineFrequenciesSelect = document.getElementById(
      "medicine-frequencies-select",
    ) as HTMLSelectElement;
    const medicineId =
      medicineSelect.options[medicineSelect.selectedIndex].value;
    const medicineRouteId =
      medicineRoutesForAdministrationSelect.options[
        medicineRoutesForAdministrationSelect.selectedIndex
      ].value;
    const medicineRouteText =
      medicineRoutesForAdministrationSelect.options[
        medicineRoutesForAdministrationSelect.selectedIndex
      ].innerText;
    const medicineFrequencyId =
      medicineFrequenciesSelect.options[medicineFrequenciesSelect.selectedIndex]
        .value;
    const medicineFrequenciesText =
      medicineFrequenciesSelect.options[medicineFrequenciesSelect.selectedIndex]
        .innerText;
    const medicineName =
      medicineSelect.options[medicineSelect.selectedIndex].innerText;
    const doseAmountInput = (
      document.getElementById("medicine-dose-amount-input") as HTMLInputElement
    )?.value;

    if (medicineId === "") {
      toast.error("יש לבחור תרופה");
      return;
    }
    if (medicineFrequencyId === "") {
      toast.error("יש לבחור תדירות");
      return;
    }
    if (doseAmountInput === "") {
      toast.error("יש להקליד מספר כמות");
      return;
    }
    if (medicineRouteId === "") {
      toast.error("יש לבחור אופן מתן תרופה");
      return;
    }

    const selectedMedicineFromList = medicineList.find(
      (medicine) => medicine.value === medicineId,
    );
    if (!selectedMedicineFromList) {
      toast.error("התרופה שנבחרה אינה תקינה");
      return;
    }

    let isMedicineIdExist = false;
    let shouldEdit = false;
    selectedMedicines.forEach((medicine) => {
      if (medicine.value.toString() === medicineId) {
        isMedicineIdExist = true;
        if (
          medicine.frequencyId.toString() !== medicineFrequencyId ||
          medicine.doseAmount.toString() !== doseAmountInput ||
          medicine.medicineRouteId.toString() !== medicineRouteId
        ) {
          shouldEdit = true;
        }
      }
    });

    let filteredMedicines;
    if (isMedicineIdExist && !shouldEdit) {
      toast.error("התרופה כבר קיימת ברשימה");
      return;
    } else if (isMedicineIdExist && shouldEdit) {
      toast.success("התרופה נערכה בהצלחה");
      filteredMedicines = selectedMedicines.filter(
        (medicine) => medicine.value.toString() !== medicineId,
      );
      setSelectedMedicines(filteredMedicines);
      if (setStateSelectedMedicines)
        setStateSelectedMedicines(filteredMedicines);
    }

    const medicines = [
      ...(filteredMedicines ?? selectedMedicines),
      {
        value: medicineId,
        text: medicineName,
        measureUnitId: selectedMedicineFromList.measureUnitId,
        measureUnitText: selectedMedicineFromList.measureUnitText,
        frequencyId: medicineFrequencyId,
        frequencyText: medicineFrequenciesText,
        doseAmount: parseFloat(doseAmountInput),
        medicineRouteId: medicineRouteId,
        medicineRouteText: medicineRouteText,
        rangeMax: selectedMedicineFromList.rangeMax,
        rangeMin: selectedMedicineFromList.rangeMin,
        totalDose: selectedMedicineFromList.totalDose,
        comments: selectedMedicineFromList.comments,
        defaultMedicineRouteId:
          selectedMedicineFromList.defaultMedicineRouteId ?? null,
        defaultFrequencyId: selectedMedicineFromList.defaultFrequencyId ?? null,
      },
    ];

    const sortedMedicines = [...medicines].sort(
      (a: MedicineSelectOptionObj, b: MedicineSelectOptionObj) =>
        a.text.localeCompare(b.text),
    );
    setSelectedMedicines(sortedMedicines);
    if (setStateSelectedMedicines) {
      setStateSelectedMedicines(sortedMedicines);
    }
  };

  const deleteMedicine = (index: number) => {
    const filteredMedicines = selectedMedicines.filter((_, i) => i !== index);
    setSelectedMedicines(filteredMedicines);
    if (setStateSelectedMedicines) setStateSelectedMedicines(filteredMedicines);
  };

  const updateValuesInInputs = (index: number) => {
    const medicine = selectedMedicines[index];
    handleMedicineSelection(medicine);
    const doseAmountInput = document.getElementById(
      "medicine-dose-amount-input",
    ) as HTMLInputElement;
    const doseToSet = medicine.doseAmount;
    if (doseAmountInput) doseAmountInput.value = doseToSet.toString();
    setDoseAmount(doseToSet);

    const medicineSelect = document.getElementById(
      "medicine-select",
    ) as HTMLSelectElement;
    if (medicineSelect) medicineSelect.value = medicine.value;

    const medicineFrequencySelect = document.getElementById(
      "medicine-frequencies-select",
    ) as HTMLSelectElement;
    if (medicineFrequencySelect)
      medicineFrequencySelect.value = medicine.frequencyId.toString();

    const medicineRouteSelect = document.getElementById(
      "medicine-routes-for-administration-select",
    ) as HTMLSelectElement;
    if (medicineRouteSelect)
      medicineRouteSelect.value = medicine.medicineRouteId.toString();
  };

  const isDoseAmountNotRecommended = (
    rangeMax?: number,
    rangeMin?: number,
    totalDose?: number,
  ) => {
    return isDoseAmountOutOfRecommendedRange({
      rangeMax,
      rangeMin,
      totalDose,
      doseAmount,
      animalWeight,
    });
  };

  const onRangeInputChange = (value: number) => {
    if (animalWeight) {
      const val = (value * animalWeight).toFixed(2);
      const doseAmountInput = document.getElementById(
        "medicine-dose-amount-input",
      ) as HTMLInputElement;
      if (doseAmountInput) doseAmountInput.value = val.toString();
      setDoseAmount(parseFloat(val));
    }
  };

  const handleMedicineSelection = (selected: MedicineSelectOptionObj) => {
    setReloadRangeSlider(!reloadRangeSlider);
    setSelectedMedicine(selected);
    const medicineCommentsTextarea = document.getElementById(
      "medicine-comments-input",
    ) as HTMLTextAreaElement;
    if (medicineCommentsTextarea)
      medicineCommentsTextarea.value = selected.comments;

    const doseAmountInput = document.getElementById(
      "medicine-dose-amount-input",
    ) as HTMLInputElement;
    if (doseAmountInput) {
      doseAmountInput.value = "";
      setDoseAmount(undefined);
      if (animalWeight) {
        if (selected?.totalDose !== undefined && selected?.totalDose !== null) {
          let val = selected?.totalDose;
          doseAmountInput.value = val.toString();
          setDoseAmount(val);
        } else if (hasDoseRange(selected)) {
          if (selected?.rangeMax === selected?.rangeMin) {
            let val = (selected?.rangeMax * animalWeight).toFixed(2);
            doseAmountInput.value = val.toString();
            setDoseAmount(parseFloat(val));
          } else {
            let val = (
              ((selected?.rangeMin + selected?.rangeMax) / 2) *
              animalWeight
            ).toFixed(2);
            doseAmountInput.value = val.toString();
            setDoseAmount(parseFloat(val));
          }
        }
      }
    }

    const medicineFrequencySelect = document.getElementById(
      "medicine-frequencies-select",
    ) as HTMLSelectElement;
    if (medicineFrequencySelect)
      medicineFrequencySelect.value = selected?.defaultFrequencyId
        ? selected.defaultFrequencyId.toString()
        : "";

    const medicineRouteSelect = document.getElementById(
      "medicine-routes-for-administration-select",
    ) as HTMLSelectElement;
    if (medicineRouteSelect)
      medicineRouteSelect.value = selected?.defaultMedicineRouteId
        ? selected.defaultMedicineRouteId.toString()
        : "";
  };

  useEffect(() => {
    getMedicinesRoutesForAdministration();
    getMedicinesFrequencies();
  }, []);

  return {
    medicinesRoutesForAdministration,
    medicinesFrequencies,
    selectedMedicines,
    selectedMedicine,
    setDoseAmount,
    reloadRangeSlider,
    addMedicine,
    deleteMedicine,
    updateValuesInInputs,
    isDoseAmountNotRecommended,
    onRangeInputChange,
    handleMedicineSelection,
  };
}
