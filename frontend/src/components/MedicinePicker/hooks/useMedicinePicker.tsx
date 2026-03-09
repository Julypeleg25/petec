import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MedicineSelectOptionObj } from "../MedicinePicker.types";
import {
  hasMedicinePickerDraftChanged,
  hydrateSelectedMedicinesWithCatalog,
  isDoseAmountOutOfRecommendedRange,
  resolveDoseAmountBySelection,
  toNonEmptyString,
  type MedicineSelectionSource,
} from "./useMedicinePicker.utils";
import { mapSystemTypeToSelectOption } from "../../../features/system-management/mappers/systemTypes.mappers";
import { buildMedicinePickerSelectableOptions } from "../MedicinePicker.utils";
import {
  useFrequencies,
  useRoutesOfAdministration,
} from "../../../features/medicine/hooks/useMedicineApi";

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
  const { data: routeData } = useRoutesOfAdministration();
  const { data: frequencyData } = useFrequencies();
  const [selectedMedicines, setSelectedMedicines] = useState<
    MedicineSelectOptionObj[]
  >(selectedMedicinesList);
  const [selectedMedicine, setSelectedMedicine] =
    useState<MedicineSelectOptionObj>();
  const [doseAmount, setDoseAmount] = useState<number>();
  const [selectedMedicineId, setSelectedMedicineId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedFrequencyId, setSelectedFrequencyId] = useState("");
  const [medicineComments, setMedicineComments] = useState("");
  const [doseAmountInput, setDoseAmountInput] = useState("");
  const [reloadRangeSlider, setReloadRangeSlider] = useState(false);
  const [editingMedicineIndex, setEditingMedicineIndex] = useState<number | null>(
    null,
  );
  const editingMedicine =
    editingMedicineIndex === null
      ? undefined
      : selectedMedicines[editingMedicineIndex];
  const editingMedicineValue = editingMedicine
    ? String(editingMedicine.value)
    : "";
  const medicinesRoutesForAdministration = useMemo(
    () => (routeData ?? []).map(mapSystemTypeToSelectOption),
    [routeData],
  );
  const medicinesFrequencies = useMemo(
    () => (frequencyData ?? []).map(mapSystemTypeToSelectOption),
    [frequencyData],
  );

  useEffect(() => {
    setSelectedMedicines(
      hydrateSelectedMedicinesWithCatalog(selectedMedicinesList, medicineList),
    );
  }, [medicineList, selectedMedicinesList]);

  const syncSelectedMedicines = useCallback((
    nextMedicines: MedicineSelectOptionObj[],
  ): void => {
    const sortedMedicines = [...nextMedicines].sort(
      (left, right) => left.text.localeCompare(right.text),
    );
    setSelectedMedicines(sortedMedicines);
    if (setStateSelectedMedicines) {
      setStateSelectedMedicines(sortedMedicines);
    }
  }, [setStateSelectedMedicines]);

  const clearMedicineForm = useCallback((): void => {
    setSelectedMedicine(undefined);
    setSelectedMedicineId("");
    setSelectedRouteId("");
    setSelectedFrequencyId("");
    setMedicineComments("");
    setDoseAmount(undefined);
    setDoseAmountInput("");
    setEditingMedicineIndex(null);
  }, []);

  const applySelectedMedicineToForm = useCallback((
    selected: MedicineSelectOptionObj,
    source: MedicineSelectionSource,
  ) => {
    setReloadRangeSlider((previousValue) => !previousValue);
    setSelectedMedicine(selected);
    setSelectedMedicineId(String(selected.value));
    setSelectedFrequencyId(toNonEmptyString(selected.dosageFrequencyId));
    setSelectedRouteId(toNonEmptyString(selected.routeOfAdministrationId));
    setMedicineComments(selected.comments ?? "");

    const nextDoseAmount = resolveDoseAmountBySelection(
      selected,
      animalWeight,
      source,
    );

    setDoseAmount(nextDoseAmount);
    setDoseAmountInput(
      nextDoseAmount === undefined ? "" : String(nextDoseAmount),
    );
  }, [animalWeight]);

  const addMedicine = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMedicineId === "") {
      toast.error("יש לבחור תרופה");
      return;
    }
    if (selectedFrequencyId === "") {
      toast.error("יש לבחור תדירות");
      return;
    }
    if (doseAmountInput === "") {
      toast.error("יש להקליד מספר כמות");
      return;
    }
    if (selectedRouteId === "") {
      toast.error("יש לבחור אופן מתן תרופה");
      return;
    }

    const selectedMedicineFromList = medicineList.find(
      (medicine) => medicine.value === selectedMedicineId,
    );
    if (!selectedMedicineFromList) {
      toast.error("התרופה שנבחרה אינה תקינה");
      return;
    }

    const selectedRoute = medicinesRoutesForAdministration.find(
      (option) => option.value === selectedRouteId,
    );
    const selectedFrequency = medicinesFrequencies.find(
      (option) => option.value === selectedFrequencyId,
    );

    const nextMedicine: MedicineSelectOptionObj = {
      value: selectedMedicineId,
      text: selectedMedicineFromList.text,
      measureUnitTypeId: toNonEmptyString(
        selectedMedicineFromList.measureUnitTypeId,
      ),
      measureUnitText: selectedMedicineFromList.measureUnitText,
      dosageFrequencyId: selectedFrequencyId,
      frequencyText: selectedFrequency?.text ?? "",
      doseAmount: Number.parseFloat(doseAmountInput),
      routeOfAdministrationId: selectedRouteId,
      medicineRouteText: selectedRoute?.text ?? "",
      rangeMax: selectedMedicineFromList.rangeMax,
      rangeMin: selectedMedicineFromList.rangeMin,
      totalDose: selectedMedicineFromList.totalDose,
      comments: selectedMedicineFromList.comments,
      dosageText: selectedMedicineFromList.dosageText,
    };

    if (editingMedicineIndex !== null) {
      if (
        !hasMedicinePickerDraftChanged(editingMedicine, {
          medicineValue: selectedMedicineId,
          routeOfAdministrationId: selectedRouteId,
          dosageFrequencyId: selectedFrequencyId,
          doseAmountInput,
        })
      ) {
        toast.error("לא בוצעו שינויים");
        return;
      }

      const editableMedicines = selectedMedicines.filter(
        (_, index) => index !== editingMedicineIndex,
      );
      const duplicateMedicine = editableMedicines.some(
        (medicine) => medicine.value.toString() === selectedMedicineId,
      );

      if (duplicateMedicine) {
        toast.error("התרופה כבר קיימת ברשימה");
        return;
      }

      syncSelectedMedicines([...editableMedicines, nextMedicine]);
      clearMedicineForm();
      toast.success("התרופה נערכה בהצלחה");
      return;
    }

    const duplicateMedicine = selectedMedicines.some(
      (medicine) => medicine.value.toString() === selectedMedicineId,
    );
    if (duplicateMedicine) {
      toast.error("התרופה כבר קיימת ברשימה");
      return;
    }

    syncSelectedMedicines([...selectedMedicines, nextMedicine]);
    clearMedicineForm();
  }, [
    clearMedicineForm,
    doseAmountInput,
    editingMedicine,
    editingMedicineIndex,
    medicineList,
    medicinesFrequencies,
    medicinesRoutesForAdministration,
    selectedFrequencyId,
    selectedMedicines,
    selectedMedicineId,
    selectedRouteId,
    syncSelectedMedicines,
  ]);

  const deleteMedicine = useCallback((index: number) => {
    const filteredMedicines = selectedMedicines.filter((_, i) => i !== index);
    syncSelectedMedicines(filteredMedicines);

    if (editingMedicineIndex === index) {
      clearMedicineForm();
      return;
    }

    if (editingMedicineIndex !== null && editingMedicineIndex > index) {
      setEditingMedicineIndex(editingMedicineIndex - 1);
    }
  }, [
    clearMedicineForm,
    editingMedicineIndex,
    selectedMedicines,
    syncSelectedMedicines,
  ]);

  const updateValuesInInputs = useCallback((index: number) => {
    const medicine = selectedMedicines[index];
    if (!medicine) {
      return;
    }

    setEditingMedicineIndex(index);
    applySelectedMedicineToForm(medicine, "selected");
  }, [applySelectedMedicineToForm, selectedMedicines]);

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

  const onRangeInputChange = useCallback((value: number) => {
    if (animalWeight) {
      const val = (value * animalWeight).toFixed(2);
      setDoseAmount(parseFloat(val));
      setDoseAmountInput(val.toString());
    }
  }, [animalWeight]);

  const handleMedicineSelection = useCallback((
    selected: MedicineSelectOptionObj,
    source: MedicineSelectionSource = "catalog",
  ) => {
    if (source === "catalog" && editingMedicineIndex !== null) {
      const editingMedicine = selectedMedicines[editingMedicineIndex];
      if (!editingMedicine || String(editingMedicine.value) !== String(selected.value)) {
        setEditingMedicineIndex(null);
      }
    }

    applySelectedMedicineToForm(selected, source);
  }, [applySelectedMedicineToForm, editingMedicineIndex, selectedMedicines]);

  const handleCatalogMedicineSelection = useCallback((selectedValue: string) => {
    const selected = medicineList.find(
      (medicine) => String(medicine.value) === selectedValue,
    );
    if (!selected) {
      return;
    }

    handleMedicineSelection(selected, "catalog");
  }, [handleMedicineSelection, medicineList]);

  const handleDoseAmountInputChange = useCallback((value: string) => {
    setDoseAmountInput(value);
    setDoseAmount(value === "" ? undefined : Number.parseFloat(value));
  }, []);

  const isEditingSelectionChanged = useMemo(() => hasMedicinePickerDraftChanged(
    editingMedicine,
    {
      medicineValue: selectedMedicineId,
      routeOfAdministrationId: selectedRouteId,
      dosageFrequencyId: selectedFrequencyId,
      doseAmountInput,
    },
  ), [
    doseAmountInput,
    editingMedicine,
    selectedFrequencyId,
    selectedMedicineId,
    selectedRouteId,
  ]);

  const medicineSelectOptions = useMemo(() => buildMedicinePickerSelectableOptions(
    medicineList,
    selectedMedicines,
    editingMedicineValue,
  ), [
    editingMedicineValue,
    medicineList,
    selectedMedicines,
  ]);

  return {
    medicinesRoutesForAdministration,
    medicinesFrequencies,
    selectedMedicines,
    selectedMedicine,
    selectedMedicineId,
    selectedRouteId,
    selectedFrequencyId,
    medicineComments,
    doseAmountInput,
    setDoseAmount,
    setSelectedRouteId,
    setSelectedFrequencyId,
    setDoseAmountInput,
    reloadRangeSlider,
    editingMedicineIndex,
    isEditingSelectionChanged,
    medicineSelectOptions,
    addMedicine,
    deleteMedicine,
    updateValuesInInputs,
    isDoseAmountNotRecommended,
    onRangeInputChange,
    handleCatalogMedicineSelection,
    handleDoseAmountInputChange,
  };
}
