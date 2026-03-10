import MedicinePicker from "../MedicinePicker/MedicinePicker";
import { Controller } from "react-hook-form";
import "./ReleasePatient.css";
import { getDateForInput } from "../../utils/DateFormattingUtil";
import DatePicker from "../../utils/DatePicker/DatePicker";
import MyLoader from "../../utils/MyLoader/MyLoader";
import { useReleasePatient } from "./hooks/useReleasePatient";

interface ReleasePatientProps {
  caseId: string;
  caseSerialId: string;
  setShowReleasePatientModal: React.Dispatch<React.SetStateAction<boolean>>;
  isReleased: boolean;
  setIsReleased: React.Dispatch<React.SetStateAction<boolean>>;
  animalWeight?: number;
}

function ReleasePatient({
  caseId,
  caseSerialId,
  setShowReleasePatientModal,
  setIsReleased,
  isReleased,
  animalWeight,
}: ReleasePatientProps) {
  const {
    loading,
    formData,
    errors,
    control,
    releasePatient,
    medicineList,
    selectedMedicines,
    setSelectedMedicines,
  } = useReleasePatient({
    caseId,
    caseSerialId,
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
              noValidate
            >
              {isReleased && (
                <div style={{ width: "100%" }}>
                  <DatePicker
                    labelText="תאריך שחרור:"
                    name="releaseDate"
                    state={formData.releaseDate}
                    disabled={true}
                  />
                </div>
              )}

              <Controller
                name="stitchesRemovalDate"
                control={control}
                render={({ field }) => (
                  <div style={{ width: "100%" }}>
                    <DatePicker
                      labelText="תאריך הסרת תפרים:"
                      name={field.name}
                      state={field.value ?? ""}
                      setState={field.onChange}
                      min={getDateForInput(new Date())}
                    />
                    {errors.stitchesRemovalDate && (
                      <p className="form-error">
                        {errors.stitchesRemovalDate.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="nextInspectionDate"
                control={control}
                render={({ field }) => (
                  <div style={{ width: "100%" }}>
                    <DatePicker
                      labelText="תאריך ביקורת:"
                      name={field.name}
                      state={field.value ?? ""}
                      setState={field.onChange}
                      min={getDateForInput(new Date())}
                    />
                    {errors.nextInspectionDate && (
                      <p className="form-error">
                        {errors.nextInspectionDate.message}
                      </p>
                    )}
                  </div>
                )}
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
