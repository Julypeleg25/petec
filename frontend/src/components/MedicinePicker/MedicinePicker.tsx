import { useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import { FaEdit, FaPlus } from "react-icons/fa";
import FormSelect from "../../utils/FormSelect/FormSelect";
import FormInput from "../../utils/FormInput/FormInput";
import FormTextarea from "../../utils/FormTextarea/FormTextarea";
import RangeSlider from "../../utils/RangeSlider/RangeSlider";
import type { MedicinePickerProps } from "./MedicinePicker.types";
import { useMedicinePicker } from "./hooks/useMedicinePicker";
import { hasDoseRange } from "./hooks/useMedicinePicker.utils";
import { isMedicineSelectionConfirmationDisabled } from "./MedicinePicker.utils";
import { MedicinePickerSelectedItem } from "./components/MedicinePickerSelectedItem";
import "./MedicinePicker.css";

function MedicinePicker({
  medicineList,
  afterConfirmation,
  selectedMedicinesList = [],
  confirmationBaselineMedicines = selectedMedicinesList,
  setStateSelectedMedicines,
  isEdit = true,
  animalWeight,
  requireSelectionChangeForConfirmation = false,
  confirmationPreamble,
}: MedicinePickerProps) {
  const {
    medicinesRoutesForAdministration,
    medicinesFrequencies,
    selectedMedicines,
    selectedMedicine,
    selectedMedicineId,
    selectedRouteId,
    selectedFrequencyId,
    medicineComments,
    doseAmountInput,
    setSelectedRouteId,
    setSelectedFrequencyId,
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
    handleMedicineCommentsChange,
  } = useMedicinePicker({
    medicineList,
    selectedMedicinesList,
    setStateSelectedMedicines,
    animalWeight,
  });

  const isConfirmationDisabled = useMemo(() => {
    return isMedicineSelectionConfirmationDisabled(
      selectedMedicines,
      confirmationBaselineMedicines,
      requireSelectionChangeForConfirmation,
    );
  }, [
    requireSelectionChangeForConfirmation,
    selectedMedicines,
    confirmationBaselineMedicines,
  ]);
  const isMedicineActionDisabled = useMemo(() => {
    const isDraftIncomplete =
      selectedMedicineId === "" ||
      selectedRouteId === "" ||
      selectedFrequencyId === "" ||
      doseAmountInput.trim() === "";

    return (
      isDraftIncomplete ||
      (editingMedicineIndex !== null && !isEditingSelectionChanged)
    );
  }, [
    doseAmountInput,
    editingMedicineIndex,
    isEditingSelectionChanged,
    selectedFrequencyId,
    selectedMedicineId,
    selectedRouteId,
  ]);

  const handleConfirmClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (isConfirmationDisabled || !afterConfirmation) {
        return;
      }

      afterConfirmation(selectedMedicines);
    },
    [afterConfirmation, isConfirmationDisabled, selectedMedicines],
  );

  return (
    <div className="MedicinePicker" dir="rtl" lang="he">
      {isEdit && (
        <div className="medicine-inputs-container">
          <div>
            <FormSelect
              labelText="סוג תרופה:"
              elements={medicineSelectOptions}
              optionState={selectedMedicineId}
              selectId={"medicine-select"}
              width="100%"
              isRequired={true}
              afterSelect={handleCatalogMedicineSelection}
            />
            <FormSelect
              labelText="אופן מתן תרופה:"
              elements={medicinesRoutesForAdministration}
              optionState={selectedRouteId}
              setOptionState={setSelectedRouteId}
              selectId={"medicine-routes-for-administration-select"}
              width="100%"
              disabled={selectedMedicine === undefined}
              isRequired={true}
            />
            <FormTextarea
              id="medicine-comments-input"
              labelText="הערות:"
              name="comments"
              height={"70px"}
              maxLength={300}
              state={medicineComments}
              setState={handleMedicineCommentsChange}
            />
          </div>
          <div>
            <FormSelect
              labelText="תדירות:"
              elements={medicinesFrequencies}
              optionState={selectedFrequencyId}
              setOptionState={setSelectedFrequencyId}
              selectId={"medicine-frequencies-select"}
              width="100%"
              disabled={selectedMedicine === undefined}
              isRequired={true}
            />
            <div className="medicine-dose-row">
              <div className="medicine-dose-action-slot">
                <button
                  id="medicine-dose-action-button"
                  type="button"
                  className="btn medicine-dose-action-btn"
                  disabled={isMedicineActionDisabled}
                  onClick={addMedicine}
                  title={
                    editingMedicineIndex === null
                      ? "הוספת תרופה"
                      : "עריכת תרופה"
                  }
                  aria-label={
                    editingMedicineIndex === null ? "הוסף תרופה" : "עדכן תרופה"
                  }
                >
                  {editingMedicineIndex === null ? <FaPlus /> : <FaEdit />}
                </button>
              </div>
              <FormInput
                name="doseAmount"
                type="number"
                width="100%"
                min={0}
                id={"medicine-dose-amount-input"}
                labelText="כמות:"
                disabled={selectedMedicine === undefined}
                isRequired={true}
                state={doseAmountInput}
                setState={handleDoseAmountInputChange}
                className={
                  isDoseAmountNotRecommended(
                    selectedMedicine?.rangeMax,
                    selectedMedicine?.rangeMin,
                    selectedMedicine?.totalDose,
                  )
                    ? "amount-not-recommended"
                    : ""
                }
              />
            </div>
            {selectedMedicine?.totalDose && (
              <FormInput
                name="totalDose"
                type="number"
                width="100%"
                id={"medicine-total-dose-input"}
                labelText="מינון כולל:"
                disabled={true}
                state={selectedMedicine?.totalDose}
              />
            )}
            {hasDoseRange(selectedMedicine) &&
              (selectedMedicine.rangeMax === selectedMedicine.rangeMin ? (
                <FormInput
                  name="amountPerKg"
                  type="number"
                  width="100%"
                  labelText={`כמות ל- ק"ג:`}
                  disabled={true}
                  state={selectedMedicine.rangeMax}
                />
              ) : (
                <RangeSlider
                  min={selectedMedicine.rangeMin}
                  max={selectedMedicine.rangeMax}
                  step={0.01}
                  label={`טווח ערכים ל- ק"ג:`}
                  initialValue={
                    (selectedMedicine.rangeMin + selectedMedicine.rangeMax) / 2
                  }
                  onChange={onRangeInputChange}
                  reload={reloadRangeSlider}
                />
              ))}
          </div>
        </div>
      )}
      {selectedMedicines.length > 0 && (
        <div className="medicine-picker-selected-section">
          <label className="form-label medicine-picker-selected-title">
            התרופות שנבחרו:
          </label>
          <div className="medicine-picker-selected-medicines">
            {selectedMedicines.map((medicine, index) => (
              <MedicinePickerSelectedItem
                key={`${medicine.value}-${index}`}
                medicine={medicine}
                index={index}
                isEdit={isEdit}
                onEdit={updateValuesInInputs}
                onDelete={deleteMedicine}
              />
            ))}
          </div>
        </div>
      )}
      {confirmationPreamble}
      {afterConfirmation && (
        <button
          className="confirm-medicine-btn"
          disabled={isConfirmationDisabled}
          onClick={handleConfirmClick}
        >
          אישור
        </button>
      )}
    </div>
  );
}

export default MedicinePicker;
