import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MedicineSelectOptionObj } from "../MedicinePicker.types";
import {
  calculateDoseAmountFromRangeInput,
  findMedicineByValue,
  hasMedicinePickerDraftChanged,
  hydrateSelectedMedicinesWithCatalog,
  isDoseAmountOutOfRecommendedRange,
  parseDoseAmountInputValue,
  resolveDoseAmountBySelection,
  sortMedicinesByText,
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
    const sortedMedicines = sortMedicinesByText(nextMedicines);
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

    const selectedMedicineFromList = findMedicineByValue(
      medicineList,
      selectedMedicineId,
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
    if (!selectedRoute || !selectedFrequency) {
      toast.error("יש לבחור ערכי תדירות ואופן מתן תקינים");
      return;
    }

    const parsedDoseAmount = Number.parseFloat(doseAmountInput);
    if (!Number.isFinite(parsedDoseAmount) || parsedDoseAmount < 0) {
      toast.error("יש להזין כמות תקינה");
      return;
    }

    const nextMedicine: MedicineSelectOptionObj = {
      value: selectedMedicineId,
      text: selectedMedicineFromList.text,
      measureUnitTypeId: toNonEmptyString(
        selectedMedicineFromList.measureUnitTypeId,
      ),
      measureUnitText: selectedMedicineFromList.measureUnitText,
      dosageFrequencyId: selectedFrequencyId,
      frequencyText: selectedFrequency.text,
      doseAmount: parsedDoseAmount,
      routeOfAdministrationId: selectedRouteId,
      medicineRouteText: selectedRoute.text,
      rangeMax: selectedMedicineFromList.rangeMax,
      rangeMin: selectedMedicineFromList.rangeMin,
      totalDose: selectedMedicineFromList.totalDose,
      comments: medicineComments.trim() || "",
      dosageText: selectedMedicineFromList.dosageText,
    };

    if (editingMedicineIndex !== null) {
      if (
        !hasMedicinePickerDraftChanged(editingMedicine, {
          medicineValue: selectedMedicineId,
          routeOfAdministrationId: selectedRouteId,
          dosageFrequencyId: selectedFrequencyId,
          doseAmountInput,
          comments: medicineComments,
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
    toast.success("התרופה נוספה בהצלחה");
  }, [
    clearMedicineForm,
    doseAmountInput,
    editingMedicine,
    editingMedicineIndex,
    medicineList,
    medicinesFrequencies,
    medicinesRoutesForAdministration,
    medicineComments,
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
    const nextDoseAmountInput = calculateDoseAmountFromRangeInput(
      value,
      animalWeight,
    );
    if (!nextDoseAmountInput) {
      return;
    }

    setDoseAmount(Number.parseFloat(nextDoseAmountInput));
    setDoseAmountInput(nextDoseAmountInput);
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
    const selected = findMedicineByValue(medicineList, selectedValue);
    if (!selected) {
      return;
    }

    handleMedicineSelection(selected, "catalog");
  }, [handleMedicineSelection, medicineList]);

  const handleDoseAmountInputChange = useCallback((value: string) => {
    setDoseAmountInput(value);
    setDoseAmount(parseDoseAmountInputValue(value));
  }, []);
  const handleMedicineCommentsChange = useCallback((value: string) => {
    setMedicineComments(value);
  }, []);

  const isCurrentDoseAmountInvalid = useMemo(() => {
    if (doseAmountInput.trim() === "") {
      return false;
    }

    const parsedDoseAmount = Number.parseFloat(doseAmountInput);
    return !Number.isFinite(parsedDoseAmount) || parsedDoseAmount < 0;
  }, [doseAmountInput]);

  const isEditingSelectionChanged = useMemo(() => hasMedicinePickerDraftChanged(
    editingMedicine,
    {
      medicineValue: selectedMedicineId,
      routeOfAdministrationId: selectedRouteId,
      dosageFrequencyId: selectedFrequencyId,
      doseAmountInput,
      comments: medicineComments,
    },
  ), [
    medicineComments,
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
    isCurrentDoseAmountInvalid,
    medicineSelectOptions,
    addMedicine,
    deleteMedicine,
    updateValuesInInputs,
    isDoseAmountNotRecommended,
    onRangeInputChange,
    handleCatalogMedicineSelection,
    handleDoseAmountInputChange,
    handleMedicineCommentsChange,
  };
}
