import FormInput from "../../../utils/FormInput/FormInput";
import "./SavePatient.css";
import FormTextarea from "../../../utils/FormTextarea/FormTextarea";
import FormSelect from "../../../utils/FormSelect/FormSelect";
import FormUploadImage from "../../../utils/FormUploadImage/FormUploadImage";
import FormCheckbox from "../../../utils/FormCheckbox/FormCheckbox";
import { useParams, useLocation } from "react-router-dom";
import { FaArrowRight, FaInfoCircle, FaPlus, FaTrash } from "react-icons/fa";
import CaseDetailsTable from "../CaseDetailsTable/CaseDetailsTable";
import {
  getFormattedDate,
  getFormattedDateFromDBdate,
} from "../../../utils/FormattingUtil";
import DatePicker from "../../../utils/DatePicker/DatePicker";
import MyLoader from "../../../utils/MyLoader/MyLoader";
import {
  ChildCaseData
} from "./SavePatient.types";
import { SavePatientModals } from "./SavePatientModals";

import { useSavePatient } from "./useSavePatient";
import { SAVE_PATIENT_DEFAULTS } from "./save-patient.constants";

function SavePatient() {
  const location = useLocation();
  const { masterCaseId, caseId } = useParams();
  const isEdit = !location.pathname.includes(SAVE_PATIENT_DEFAULTS.NEW_PATIENT_PATH_SEGMENT);
  const caseIdString = caseId ?? "";

  const {
    navigate,
    saveBtnRef,
    saveDailyDetailsBtnRef,
    loading,
    setLoading,
    formData,
    handleInputChange,
    isArchived,
    selectedFile,
    setSelectedFile,
    genderTypes,
    selectedGenderType,
    setSelectedGenderType,
    animalTypes,
    selectedAnimalType,
    setSelectedAnimalType,
    animalColors,
    selectedAnimalColor,
    setSelectedAnimalColor,
    insuranceList,
    selectedInsurance,
    setSelectedInsurance,
    foodTypes,
    selectedFoodType,
    setSelectedFoodType,
    raceTypes,
    selectedRaceType,
    setSelectedRaceType,
    doctors,
    selectedDoctor,
    setSelectedDoctor,
    nurses,
    selectedNurse,
    setSelectedNurse,
    isConvenia,
    setIsConvenia,
    isAllergic,
    setIsAllergic,
    isEscapePotential,
    setIsEscapePotential,
    isNPO,
    setIsNPO,
    isRiskAnesthesia,
    setIsRiskAnesthesia,
    isHeartMurmur,
    setIsHeartMurmur,
    isAMB,
    setIsAMB,
    isAggressive,
    setIsAggressive,
    isCerenia,
    setIsCerenia,
    isProcedure,
    setIsProcedure,
    isReleased,
    setIsReleased,
    selectedCaseDate,
    setSelectedCaseDate,
    showCaseDetailsDaysOptions,
    setShowCaseDetailsDaysOptions,
    caseDetailsList,
    setCaseDetailsList,
    caseDetailsDataIndex,
    setCaseDetailsDataIndex,
    showReleasePatientModal,
    setShowReleasePatientModal,
    showPatientDocumentsModal,
    setShowPatientDocumentsModal,
    showPatientChartsModal,
    setShowPatientChartsModal,
    showDeletePatientCaseModal,
    setShowDeletePatientCaseModal,
    showArchiveConfirmationModal,
    setShowArchiveConfirmationModal,
    showCatheterReplacementModal,
    setShowCatheterReplacementModal,
    paintingMode,
    setPaintingMode,
    editableFieldsMode,
    setEditableFieldsMode,
    photoName,
    setPhotoName,
    patientId,
    setPatientId,
    disableAddCaseDetailsTable,
    setDisableAddCaseDetailsTable,
    childCases,
    setChildCases,
    reloadCase,
    setReloadCase,
    savePatient,
    getRaceTypes,
    addNewCaseDailyDetails,
    exportCaseDetails,
    handleCellClick,
    handlePaintingModeButtonClick,
    handleSetEditableFieldsButtonClick,
    archivePatient,
    setTimeSelectionValue,
  } = useSavePatient(caseIdString, caseId, masterCaseId, isEdit);
  return (
    <div className="SavePatient">
      {loading ? (
        <MyLoader />
      ) : (
        <div className={`${isEdit ? "edit" : "new"}-patient-form-container`}>
          {isEdit && (
            <div className="edit-patient-btns-container">
              <button
                className="btn btn-active btn-round edit-patient-back-btn"
                onClick={() => {
                  navigate(-1);
                }}
              >
                <FaArrowRight />
              </button>
              <div
                className="edit-patient-btns-container"
                style={{ flexWrap: "wrap" }}
              >
                <button
                  type="submit"
                  className="btn btn-small save-entity-form-btn"
                  form="save-patient-form"
                  ref={saveBtnRef}
                >
                  שמור
                </button>
                <button
                  className="btn btn-small save-entity-form-btn"
                  onClick={() => setShowReleasePatientModal(true)}
                >
                  שחרור
                </button>
                <button
                  className="btn btn-small save-entity-form-btn export-case-details-btn"
                  onClick={() => exportCaseDetails()}
                >
                  PDF - ייצא ל
                </button>
                <button
                  className="btn btn-small save-entity-form-btn patient-documents-case-details-btn"
                  onClick={() => setShowPatientDocumentsModal(true)}
                >
                  מסמכים
                </button>
                <button
                  className="btn btn-small save-entity-form-btn patient-charts-case-details-btn"
                  onClick={() => setShowPatientChartsModal(true)}
                >
                  מידע גרפי
                </button>
                <button
                  className="btn btn-small save-entity-form-btn patient-archive-case-details-btn"
                  onClick={() => setShowArchiveConfirmationModal(true)}
                >
                  {isArchived ? "הוצא מהארכיון" : "העבר לארכיון"}
                </button>
              </div>
              <button
                className="btn btn-small save-entity-form-btn delete-patient-btn"
                onClick={() => setShowDeletePatientCaseModal(true)}
              >
                <FaTrash />
              </button>
            </div>
          )}
          {!isEdit && <h2 className="new-patient-form-title">מטופל חדש</h2>}
          {childCases.length > 1 && (
            <div className="child-cases-container">
              {childCases.map((childCase: ChildCaseData, index) => (
                <div
                  key={index}
                  className={`child-case ${
                    childCase.caseId === caseId ? "child-case-disabled" : ""
                  }`}
                  onClick={() => {
                    if (childCase.caseId !== caseId) {
                      navigate(
                        `/patients/patientCase/${masterCaseId}/${childCase.caseId}`,
                      );
                      setReloadCase(!reloadCase);
                    }
                  }}
                >
                  <img
                    className="child-case-img"
                    src={
                      childCase.patientPhotoName
                        ? childCase.patientPhotoName
                        : SAVE_PATIENT_DEFAULTS.DEFAULT_PATIENT_IMAGE
                    }
                    alt="child-case"
                  />
                  <div>{childCase.patientName}</div>
                </div>
              ))}
            </div>
          )}
          <form
            id="save-patient-form"
            className={`${isEdit ? "edit" : "new"}-patient-form`}
            onSubmit={(e) => savePatient(e)}
          >
            <section className="new-patient-form-data-section">
              <section
                className={`${
                  isEdit ? "edit" : "new"
                }-patient-form-image-section`}
              >
                <FormUploadImage
                  uploadedImageId="save-patient-img"
                  isLarge={true}
                  setSelectedFile={setSelectedFile}
                  currentImage={
                    isEdit
                      ? photoName
                        ? photoName
                        : SAVE_PATIENT_DEFAULTS.DEFAULT_PATIENT_IMAGE
                      : "#"
                  }
                  isDefault={photoName !== undefined}
                />
              </section>
              <section
                className={`${
                  isEdit ? "edit" : "new"
                }-patient-form-info-section`}
              >
                <FormInput
                  labelText=":שם מטופל"
                  name="patientName"
                  isRequired={true}
                  state={formData.patientName}
                  setState={handleInputChange}
                />
                <FormInput
                  labelText=":מספר תיק"
                  name="caseId"
                  placeholder={masterCaseId}
                  isRequired={true}
                  state={isEdit ? masterCaseId : formData.caseId}
                  setState={handleInputChange}
                  type="number"
                  disabled={isEdit}
                />
                <FormInput
                  labelText=":שם בעלים"
                  name="ownerName"
                  isRequired={true}
                  state={formData.ownerName}
                  setState={handleInputChange}
                />
                <FormInput
                  labelText=":מספר טלפון"
                  name="ownerPhoneNumber"
                  isRequired={true}
                  state={formData.ownerPhoneNumber}
                  setState={handleInputChange}
                  type="tel"
                />
                <FormSelect
                  elements={insuranceList}
                  optionState={selectedInsurance}
                  setOptionState={setSelectedInsurance}
                  isRequired={true}
                  selectId="new-patient-select-insurance"
                  labelText=":ביטוח"
                />
                <FormInput
                  labelText=":משקל"
                  name="weightKg"
                  isRequired={true}
                  state={formData.weightKg}
                  setState={handleInputChange}
                  type="number"
                  min={0}
                />
                <div className="patient-age-container form-input-container">
                  <div className="patient-age-inputs">
                    <FormInput
                      labelText=":(חודשים) גיל"
                      name="ageMonths"
                      state={formData.ageMonths}
                      setState={handleInputChange}
                      type="number"
                      min={0}
                      max={11}
                      width="49%"
                    />
                    <FormInput
                      labelText=":(שנים) גיל"
                      name="ageYears"
                      state={formData.ageYears}
                      setState={handleInputChange}
                      type="number"
                      min={0}
                      width="49%"
                    />
                  </div>
                </div>
                <FormSelect
                  elements={genderTypes}
                  optionState={selectedGenderType}
                  setOptionState={setSelectedGenderType}
                  isRequired={true}
                  selectId="new-patient-select-gender-type"
                  labelText=":מין"
                />
                <FormSelect
                  elements={animalTypes}
                  optionState={selectedAnimalType}
                  setOptionState={setSelectedAnimalType}
                  isRequired={true}
                  selectId="new-patient-select-animal-type"
                  labelText=":סוג"
                  afterSelect={(selectedValue) => {
                    setSelectedRaceType("");
                    getRaceTypes(selectedValue);
                  }}
                />
                <FormSelect
                  elements={raceTypes}
                  optionState={selectedRaceType}
                  setOptionState={setSelectedRaceType}
                  selectId="new-patient-select-race-type"
                  labelText=":גזע"
                />
                <FormSelect
                  elements={animalColors}
                  optionState={selectedAnimalColor}
                  setOptionState={setSelectedAnimalColor}
                  isRequired={true}
                  selectId="new-patient-select-animal-color"
                  labelText=":צבע"
                />
                <FormSelect
                  elements={doctors}
                  optionState={selectedDoctor}
                  setOptionState={setSelectedDoctor}
                  isRequired={true}
                  selectId="new-patient-select-doctor"
                  labelText=":רופא/ה מטפל/ת"
                />
                <FormSelect
                  elements={nurses}
                  optionState={selectedNurse}
                  setOptionState={setSelectedNurse}
                  isRequired={true}
                  selectId="new-patient-select-nurse"
                  labelText=":אח/ות מטפל/ת"
                />
                <FormInput
                  labelText=":רופא מפנה"
                  name="referringDoctor"
                  state={formData.referringDoctor}
                  setState={handleInputChange}
                />
                <FormInput
                  labelText=":IDEXX לינק"
                  name="bloodTestLink"
                  state={formData.bloodTestLink}
                  setState={handleInputChange}
                  isLink={true}
                />
                <FormSelect
                  elements={foodTypes}
                  optionState={selectedFoodType}
                  setOptionState={setSelectedFoodType}
                  isRequired={true}
                  selectId="new-patient-select-animal-food-type"
                  labelText=":סוג אוכל"
                />
                <DatePicker
                  labelText=":תאריך הכנסת קטטר"
                  name="catheterDate"
                  state={formData.catheterDate}
                  setState={handleInputChange}
                />
                <DatePicker
                  labelText=":תאריך פרוצדורה"
                  name="procedureDate"
                  state={formData.procedureDate}
                  setState={handleInputChange}
                  afterChange={(value) =>
                    setIsProcedure(value !== null && value !== "")
                  }
                />
                <FormTextarea
                  labelText=":סיבת האישפוז"
                  name="hospitalizationReason"
                  isRequired={true}
                  state={formData.hospitalizationReason}
                  setState={handleInputChange}
                  height={"70px"}
                  maxLength={300}
                />
                <FormTextarea
                  labelText=":אלרגיה הערות"
                  name="allergicComments"
                  state={formData.allergicComments}
                  setState={handleInputChange}
                  height={"70px"}
                  maxLength={300}
                />
                <div
                  className={`${
                    isEdit ? "edit" : "new"
                  }-patient-form-checkboxes`}
                >
                  <FormCheckbox
                    labelText="AMB"
                    checked={isAMB}
                    setChecked={setIsAMB}
                  />
                  <FormCheckbox
                    labelText="אוושה"
                    checked={isHeartMurmur}
                    setChecked={setIsHeartMurmur}
                  />
                  <FormCheckbox
                    labelText="הרדמה בסיכון"
                    checked={isRiskAnesthesia}
                    setChecked={setIsRiskAnesthesia}
                  />
                  <FormCheckbox
                    labelText="NPO"
                    checked={isNPO}
                    setChecked={setIsNPO}
                  />
                  <FormCheckbox
                    labelText="תוקפן"
                    checked={isAggressive}
                    setChecked={setIsAggressive}
                  />
                  <FormCheckbox
                    labelText="ברחן"
                    checked={isEscapePotential}
                    setChecked={setIsEscapePotential}
                  />
                  <FormCheckbox
                    labelText="סרניה"
                    checked={isCerenia}
                    setChecked={setIsCerenia}
                  />
                  <FormCheckbox
                    labelText="קונבניה"
                    checked={isConvenia}
                    setChecked={setIsConvenia}
                  />
                  <FormCheckbox
                    labelText="אלרגיה"
                    checked={isAllergic}
                    setChecked={setIsAllergic}
                  />
                  <FormCheckbox
                    labelText="פרוצדורה"
                    checked={isProcedure}
                    setChecked={setIsProcedure}
                  />
                </div>
              </section>
            </section>
            {!isEdit && (
              <button
                type="submit"
                className="btn btn-small save-entity-form-btn new-patient-form-btn"
              >
                שמור
              </button>
            )}
            {isEdit && (
              <div className="above-daily-details-table-section">
                <div className="daily-details-table-fields-info">
                  <FaInfoCircle color="var(--color-main)" size={20} />
                  <div>
                    <div>
                      <div className="daily-details-table-fields-info-field">
                        <span>
                          {animalTypes.find(
                            (type) => type.value === selectedAnimalType,
                          )?.text || "-"}
                        </span>
                        <label>:סוג חיה</label>
                      </div>
                      <div className="daily-details-table-fields-info-field">
                        <span>
                          {getFormattedDateFromDBdate(formData.catheterDate) ||
                            "-"}
                        </span>
                        <label>:תאריך הכנסת קטטר</label>
                      </div>
                    </div>
                    <div>
                      <div className="daily-details-table-fields-info-field">
                        <span style={{ marginRight: "0.3em" }}>ק"ג</span>
                        <span>{formData.weightKg}</span>
                        <label>:משקל</label>
                      </div>
                      <div className="daily-details-table-fields-info-field">
                        <span>{formData.patientName}</span>
                        <label>:שם</label>
                      </div>
                    </div>
                  </div>
                </div>
                <FormTextarea
                  labelText=":הערות"
                  name="comments"
                  state={formData.comments}
                  setState={handleInputChange}
                  height={"70px"}
                  width="300px"
                  maxWidth="300px"
                  maxLength={2000}
                />
                <div className="daily-details-btns-container">
                  {showCaseDetailsDaysOptions && (
                    <div className="case-daily-details-date-picker">
                      <FormSelect
                        elements={caseDetailsList.map((caseDetails) => {
                          const caseDate = caseDetails[1].date;
                          const lastCaseObj =
                            caseDetailsList[caseDetailsList.length > 1 ? 1 : 0];
                          const caseLastDate =
                            lastCaseObj[lastCaseObj.length - 1].date;
                          const today = new Date();
                          let newDate = new Date();

                          if (caseLastDate) {
                            if (today > new Date(caseLastDate))
                              newDate = new Date();
                            else newDate = new Date(caseLastDate);
                          }

                          return {
                            value: caseDetails[1].id?.toString() || "-1",
                            text:
                              caseDate !== undefined
                                ? getFormattedDateFromDBdate(caseDate)
                                : getFormattedDate(newDate),
                          };
                        })}
                        selectId="select-daily-case-details-date-picker"
                        optionState={selectedCaseDate}
                        setOptionState={setSelectedCaseDate}
                        labelText=":תאריך"
                        width="220px"
                        afterSelect={(value) => {
                          const caseDetailsIndex = caseDetailsList.findIndex(
                            (caseDetails) => {
                              return caseDetails[1].id?.toString() === value;
                            },
                          );

                          setCaseDetailsDataIndex(caseDetailsIndex);

                          // Update time selection
                          const selectedCase = caseDetailsList.find(
                            (caseDetails) => {
                              return caseDetails[1].id?.toString() === value;
                            },
                          );

                          setTimeSelectionValue(
                            selectedCase
                              ? selectedCase[1].time.split(":")[0]
                              : "",
                          );
                        }}
                        isOrdered={false}
                      />
                    </div>
                  )}
                  <div className="daily-details-btns">
                    <button
                      type="submit"
                      className="btn btn-small daily-details-save-btn"
                      form="save-patient-form"
                      ref={saveDailyDetailsBtnRef}
                    >
                      שמור
                    </button>
                    <button
                      id="paintButton"
                      onClick={(e) => handlePaintingModeButtonClick(e)}
                      className="btn btn-small paint-button"
                    >
                      {paintingMode ? "עצור סימון" : "סימון שדות חובה"}
                    </button>
                    <button
                      id="setEditableFieldsButton"
                      onClick={(e) => handleSetEditableFieldsButtonClick(e)}
                      className="btn btn-small paint-button"
                    >
                      {editableFieldsMode ? "עצור סימון" : "סימון ביטול שדות"}
                    </button>
                    <button
                      onClick={(e) => addNewCaseDailyDetails(e)}
                      className="btn btn-small add-new-case-daily-details-btn"
                      disabled={disableAddCaseDetailsTable}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
              </div>
            )}
            {isEdit && (
              <CaseDetailsTable
                caseDetailsList={caseDetailsList}
                setCaseDetailsList={setCaseDetailsList}
                caseDetailsDataIndex={caseDetailsDataIndex}
                handleCellClick={handleCellClick}
                paintingMode={paintingMode}
                animalWeight={formData.weightKg}
                animalId={parseInt(selectedAnimalType)}
              />
            )}
          </form>
        </div>
      )}
      <SavePatientModals
        isEdit={isEdit}
        caseIdString={caseIdString}
        masterCaseId={masterCaseId}
        patientId={patientId}
        weightKg={formData.weightKg}
        catheterDate={formData.catheterDate}
        isReleased={isReleased}
        setIsReleased={setIsReleased}
        showReleasePatientModal={showReleasePatientModal}
        setShowReleasePatientModal={setShowReleasePatientModal}
        showDeletePatientCaseModal={showDeletePatientCaseModal}
        setShowDeletePatientCaseModal={setShowDeletePatientCaseModal}
        showPatientDocumentsModal={showPatientDocumentsModal}
        setShowPatientDocumentsModal={setShowPatientDocumentsModal}
        showPatientChartsModal={showPatientChartsModal}
        setShowPatientChartsModal={setShowPatientChartsModal}
        showArchiveConfirmationModal={showArchiveConfirmationModal}
        setShowArchiveConfirmationModal={setShowArchiveConfirmationModal}
        isArchived={isArchived}
        archivePatient={archivePatient}
        showCatheterReplacementModal={showCatheterReplacementModal}
        setShowCatheterReplacementModal={setShowCatheterReplacementModal}
      />
    </div>
  );
}

export default SavePatient;
