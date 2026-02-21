import MedicinePicker from "../MedicinePicker/MedicinePicker";
import "./ReleasePatient.css";
import { getDateForInput } from "../../utils/FormattingUtil";
import DatePicker from "../../utils/DatePicker/DatePicker";
import MyLoader from "../../utils/MyLoader/MyLoader";
import { useReleasePatient } from "./useReleasePatient";

import { ReleasePatientProps, ReleaseFormData, MedicineApiItem } from "./ReleasePatient.types";

function ReleasePatient({
  caseId,
  setShowReleasePatientModal,
  setIsReleased,
  isReleased,
  animalWeight,
}: ReleasePatientProps) {
  const {
    loading,
    formData,
    handleInputChange,
    releasePatient,
    medicineList,
    selectedMedicines,
    setSelectedMedicines,
  } = useReleasePatient({
    caseId,
    isReleased,
    setIsReleased,
    setShowReleasePatientModal,
  });

  return (
    <div className="ReleasePatient">
      {loading ? (
        <MyLoader />
      ) : (
        <>
          <label className="form-label release-patient-label">
            שחרור מטופל
          </label>
          <div className="release-patient-details-container">
            <form
              id="release-patient-form"
              className="release-patient-form"
              onSubmit={releasePatient}
            >
              {isReleased && (
                <DatePicker
                  labelText=":תאריך שחרור"
                  name="releaseDate"
                  state={formData.releaseDate}
                  setState={handleInputChange}
                  disabled={true}
                />
              )}
              <DatePicker
                labelText=":תאריך הסרת תפרים"
                name="stitchesRemovalDate"
                state={formData.stitchesRemovalDate}
                setState={handleInputChange}
                min={getDateForInput(new Date())}
              />
              <DatePicker
                labelText=":תאריך ביקורת"
                name="nextInspectionDate"
                state={formData.nextInspectionDate}
                setState={handleInputChange}
                min={getDateForInput(new Date())}
              />
            </form>
            <div className="release-patient-medicines">
              <MedicinePicker
                medicineList={medicineList}
                setStateSelectedMedicines={setSelectedMedicines}
                selectedMedicinesList={selectedMedicines}
                animalWeight={animalWeight}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-small save-entity-form-btn"
            form="release-patient-form"
          >
            שחרר
          </button>
        </>
      )}
    </div>
  );
}

export default ReleasePatient;
