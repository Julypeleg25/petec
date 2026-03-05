import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import FormSelect from "../../utils/FormSelect/FormSelect";
import FormInput from "../../utils/FormInput/FormInput";
import FormTextarea from "../../utils/FormTextarea/FormTextarea";
import RangeSlider from "../../utils/RangeSlider/RangeSlider";
import { MedicineSelectOptionObj } from "./MedicinePicker.types";
import { useMedicinePicker } from "./hooks/useMedicinePicker";
import { hasDoseRange } from "./hooks/useMedicinePicker.utils";
import "./MedicinePicker.css";

interface MedicinePickerProps {
  medicineList: MedicineSelectOptionObj[];
  afterConfirmation?: (selectedMedicines: MedicineSelectOptionObj[]) => void;
  selectedMedicinesList?: MedicineSelectOptionObj[];
  setStateSelectedMedicines?: React.Dispatch<
    React.SetStateAction<MedicineSelectOptionObj[]>
  >;
  isEdit?: boolean;
  animalWeight?: number;
}

function MedicinePicker({
  medicineList,
  afterConfirmation,
  selectedMedicinesList = [],
  setStateSelectedMedicines,
  isEdit = true,
  animalWeight,
}: MedicinePickerProps) {
  const {
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
  } = useMedicinePicker({
    medicineList,
    selectedMedicinesList,
    setStateSelectedMedicines,
    animalWeight,
  });

  return (
    <div className="MedicinePicker">
      {isEdit && (
        <div className="medicine-inputs-container">
          <div>
            <FormSelect
              labelText=":סוג תרופה"
              elements={medicineList}
              selectId={"medicine-select"}
              width="100%"
              isRequired={true}
              afterSelect={(value) => {
                const selected = medicineList.find((m) => m.value === value);
                if (selected) handleMedicineSelection(selected);
              }}
            />
            <FormSelect
              labelText=":אופן מתן תרופה"
              elements={medicinesRoutesForAdministration}
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
              readOnly={true}
            />
          </div>
          <div>
            <FormSelect
              labelText=":תדירות"
              elements={medicinesFrequencies}
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
              setState={(val: string) => {
                setDoseAmount(parseFloat(val));
              }}
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
          <button className="add-medicine-btn" onClick={addMedicine}>
            <FaPlus />
          </button>
        </div>
      )}
      {selectedMedicines.length > 0 && (
        <div className="medicine-picker-selected-medicines">
          <label className="form-label">התרופות שנבחרו:</label>
          {selectedMedicines.map((medicine, index) => {
            return (
              <div
                key={index}
                className="medicine-picker-selected-medicines-cell"
              >
                {isEdit && (
                  <>
                    <button
                      className="edit-medicine-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        updateValuesInInputs(index);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-medicine-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteMedicine(index);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
                <div>
                  <span className="selected-medicine-name">
                    {medicine.text}
                  </span>
                  {` ${medicine.doseAmount}${medicine.measureUnitText} ${medicine.frequencyText} ${medicine.medicineRouteText}`}
                  {!isEdit && " -"}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {afterConfirmation && (
        <button
          className="confirm-medicine-btn"
          onClick={(e) => {
            e.preventDefault();
            afterConfirmation(selectedMedicines);
          }}
        >
          אישור
        </button>
      )}
    </div>
  );
}

export default MedicinePicker;
