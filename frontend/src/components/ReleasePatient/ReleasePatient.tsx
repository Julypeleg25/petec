import { Controller } from "react-hook-form";
import MedicinePicker from "../MedicinePicker/MedicinePicker";
import { Button } from "../../utils/Button/Button";
import DatePicker from "../../utils/DatePicker/DatePicker";
import FormInput from "../../utils/FormInput/FormInput";
import MyLoader from "../../utils/MyLoader/MyLoader";
import {
  getDateForInput,
  getFormattedDateFromDBdate,
} from "../../utils/DateFormattingUtil";
import { useReleasePatient } from "./hooks/useReleasePatient";
import "./ReleasePatient.css";

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
    <div className="ReleasePatient release-patient-dialog" dir="rtl">
      <div className="save-entity-form-container release-patient-form-container">
        <div className="release-patient-dialog__header">
          <div className="release-patient-dialog__title-wrap">
            <h2 className="save-entity-form-title release-patient-dialog__title modal-dialog-title">
              שחרור מטופל
            </h2>
          </div>
        </div>

        {loading ? (
          <MyLoader />
        ) : (
          <>
            <form
              id="release-patient-form"
              className="release-patient-dialog__form"
              onSubmit={releasePatient}
              noValidate
            >
              <div className="release-patient-dialog__grid">
                {formData.releaseDate ? (
                  <div className="form-group release-patient-dialog__release-date">
                    <FormInput
                      labelText="תאריך שחרור"
                      name="releaseDate"
                      state={getFormattedDateFromDBdate(formData.releaseDate)}
                      type="text"
                      width="200px"
                      disabled={true}
                    />
                  </div>
                ) : null}

                <div className="form-group">
                  <Controller
                    name="stitchesRemovalDate"
                    control={control}
                    render={({ field }) => (
                      <>
                        <DatePicker
                          labelText="תאריך הסרת תפרים"
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
                      </>
                    )}
                  />
                </div>

                <div className="form-group">
                  <Controller
                    name="nextInspectionDate"
                    control={control}
                    render={({ field }) => (
                      <>
                        <DatePicker
                          labelText="תאריך ביקורת"
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
                      </>
                    )}
                  />
                </div>
              </div>

              <div
                className="release-patient-dialog__section-divider"
                aria-hidden="true"
              />

              <div className="form-group release-patient-dialog__medicines-group">
                <h3 className="release-patient-dialog__section-label">
                  תרופות לשחרור
                </h3>
                <div className="release-patient-dialog__medicines">
                  <MedicinePicker
                    medicineList={medicineList}
                    setStateSelectedMedicines={setSelectedMedicines}
                    selectedMedicinesList={selectedMedicines}
                    animalWeight={animalWeight}
                  />
                </div>
              </div>

              <div className="release-patient-dialog__actions">
                <Button
                  type="button"
                  active
                  className="release-patient-dialog__cancel-btn"
                  onClick={() => setShowReleasePatientModal(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  className="release-patient-dialog__submit-btn"
                  form="release-patient-form"
                >
                  שחרר
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ReleasePatient;
