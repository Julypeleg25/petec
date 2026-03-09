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
import {
  isMedicineSelectionConfirmationDisabled,
} from "./MedicinePicker.utils";
import { MedicinePickerSelectedItem } from "./components/MedicinePickerSelectedItem";
import "./MedicinePicker.css";

function MedicinePicker({
  medicineList,
  afterConfirmation,
  selectedMedicinesList = [],
  setStateSelectedMedicines,
  isEdit = true,
  animalWeight,
  requireSelectionChangeForConfirmation = false,
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
  } = useMedicinePicker({
    medicineList,
    selectedMedicinesList,
    setStateSelectedMedicines,
    animalWeight,
  });

  const isConfirmationDisabled = useMemo(() => {
    return isMedicineSelectionConfirmationDisabled(
      selectedMedicines,
      selectedMedicinesList,
      requireSelectionChangeForConfirmation,
    );
  }, [
    requireSelectionChangeForConfirmation,
    selectedMedicines,
    selectedMedicinesList,
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
    <div className="MedicinePicker">
      {isEdit && (
        <div className="medicine-inputs-container">
          <div>
            <FormSelect
              labelText=":סוג תרופה"
              elements={medicineSelectOptions}
              optionState={selectedMedicineId}
              selectId={"medicine-select"}
              width="100%"
              isRequired={true}
              afterSelect={handleCatalogMedicineSelection}
            />
            <FormSelect
              labelText=":אופן מתן תרופה"
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
              labelText=":הערות"
              name="comments"
              height={"70px"}
              maxLength={300}
              state={medicineComments}
              readOnly={true}
            />
          </div>
          <div>
            <FormSelect
              labelText=":תדירות"
              elements={medicinesFrequencies}
              optionState={selectedFrequencyId}
              setOptionState={setSelectedFrequencyId}
              selectId={"medicine-frequencies-select"}
              width="100%"
              disabled={selectedMedicine === undefined}
              isRequired={true}
            />
            <FormInput
              name="doseAmount"
              type="number"
              width="100%"
              min={0}
              id={"medicine-dose-amount-input"}
              labelText=":כמות"
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
            {selectedMedicine?.totalDose !== undefined &&
              selectedMedicine?.totalDose !== null && (
              <FormInput
                name="totalDose"
                type="number"
                width="100%"
                id={"medicine-total-dose-input"}
                labelText=":מינון כולל"
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
                  labelText={`:כמות ל- ק"ג`}
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
                    (selectedMedicine.rangeMin + selectedMedicine.rangeMax) /
                    2
                  }
                  onChange={onRangeInputChange}
                  reload={reloadRangeSlider}
                />
              ))}
          </div>
          <button
            className="add-medicine-btn"
            disabled={editingMedicineIndex !== null && !isEditingSelectionChanged}
            onClick={addMedicine}
            title={editingMedicineIndex === null ? "הוספת תרופה" : "עריכת תרופה"}
          >
            {editingMedicineIndex === null ? <FaPlus /> : <FaEdit />}
          </button>
        </div>
      )}
      {selectedMedicines.length > 0 && (
        <div className="medicine-picker-selected-medicines">
          <label className="form-label">התרופות שנבחרו:</label>
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
      )}
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
