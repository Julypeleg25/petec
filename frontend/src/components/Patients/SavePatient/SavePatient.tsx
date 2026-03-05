import { useParams, useLocation } from "react-router-dom";
import CaseDetailsTable from "../CaseDetailsTable/CaseDetailsTable";
import MyLoader from "../../../utils/MyLoader/MyLoader";
import "./SavePatient.css";
import { AppRoutes } from "../../../config/appRoutes";
import { SavePatientModals } from "./modals/SavePatientModals";
import { useSavePatient } from "./hooks/useSavePatient";
import { SAVE_PATIENT_DEFAULTS } from "./constants/savePatient.constants";
import SavePatientChildCasesSection from "./sections/SavePatientChildCases.section";
import SavePatientDailyDetailsSection from "./sections/SavePatientDailyDetails.section";
import SavePatientEditActionsSection from "./sections/SavePatientEditActions.section";
import SavePatientPatientInfoSection from "./sections/SavePatientPatientInfo.section";
import {
  getCaseDateSelectionData,
  resolveSelectedCaseDate,
} from "./sections/utils/savePatientSections.utils";

function SavePatient() {
  const location = useLocation();
  const { masterCaseId, caseId } = useParams();
  const isEdit = !location.pathname.includes(SAVE_PATIENT_DEFAULTS.NEW_PATIENT_PATH_SEGMENT);
  const caseIdString = caseId ?? "";

  const {
    navigate,
    isSaveButtonsDisabled,
    loading,
    formData,
    handleInputChange,
    isArchived,
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
    selectedStartHour,
    showCaseDetailsDaysOptions,
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
    editableFieldsMode,
    photoName,
    patientId,
    disableAddCaseDetailsTable,
    childCases,
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

  const handleSelectChildCase = (childCaseId: string) => {
    const resolvedMasterCaseId = masterCaseId ?? childCaseId;
    navigate(AppRoutes.Patients.Details.build(resolvedMasterCaseId, childCaseId));
    setReloadCase((previousReloadCase) => !previousReloadCase);
  };

  const handleCaseDateChange = (value: string) => {
    const { caseDetailsIndex, selectedHour } = getCaseDateSelectionData(
      caseDetailsList,
      value,
    );
    if (caseDetailsIndex < 0) {
      return;
    }
    setCaseDetailsDataIndex(caseDetailsIndex);
    setSelectedCaseDate(resolveSelectedCaseDate(caseDetailsList, caseDetailsIndex));
    setTimeSelectionValue(selectedHour);
  };

  return (
    <div className="SavePatient">
      {loading ? (
        <MyLoader />
      ) : (
        <div className={`${isEdit ? "edit" : "new"}-patient-form-container`}>
          {isEdit && (
            <SavePatientEditActionsSection
              isArchived={isArchived}
              isSaveButtonsDisabled={isSaveButtonsDisabled}
              onBack={() => navigate(-1)}
              onShowReleasePatientModal={() => setShowReleasePatientModal(true)}
              onExportCaseDetails={exportCaseDetails}
              onShowPatientDocumentsModal={() => setShowPatientDocumentsModal(true)}
              onShowPatientChartsModal={() => setShowPatientChartsModal(true)}
              onShowArchiveConfirmationModal={() =>
                setShowArchiveConfirmationModal(true)
              }
              onShowDeletePatientCaseModal={() => setShowDeletePatientCaseModal(true)}
            />
          )}
          {!isEdit && <h2 className="new-patient-form-title">מטופל חדש</h2>}
          <SavePatientChildCasesSection
            childCases={childCases}
            currentCaseId={caseId}
            onSelectChildCase={handleSelectChildCase}
          />
          <form
            id="save-patient-form"
            className={`${isEdit ? "edit" : "new"}-patient-form`}
            onSubmit={savePatient}
            noValidate
          >
            <SavePatientPatientInfoSection
              isEdit={isEdit}
              formData={formData}
              handleInputChange={handleInputChange}
              setSelectedFile={setSelectedFile}
              photoName={photoName}
              insuranceList={insuranceList}
              selectedInsurance={selectedInsurance}
              setSelectedInsurance={setSelectedInsurance}
              genderTypes={genderTypes}
              selectedGenderType={selectedGenderType}
              setSelectedGenderType={setSelectedGenderType}
              animalTypes={animalTypes}
              selectedAnimalType={selectedAnimalType}
              setSelectedAnimalType={setSelectedAnimalType}
              raceTypes={raceTypes}
              selectedRaceType={selectedRaceType}
              setSelectedRaceType={setSelectedRaceType}
              animalColors={animalColors}
              selectedAnimalColor={selectedAnimalColor}
              setSelectedAnimalColor={setSelectedAnimalColor}
              doctors={doctors}
              selectedDoctor={selectedDoctor}
              setSelectedDoctor={setSelectedDoctor}
              nurses={nurses}
              selectedNurse={selectedNurse}
              setSelectedNurse={setSelectedNurse}
              foodTypes={foodTypes}
              selectedFoodType={selectedFoodType}
              setSelectedFoodType={setSelectedFoodType}
              getRaceTypes={getRaceTypes}
              isAMB={isAMB}
              setIsAMB={setIsAMB}
              isHeartMurmur={isHeartMurmur}
              setIsHeartMurmur={setIsHeartMurmur}
              isRiskAnesthesia={isRiskAnesthesia}
              setIsRiskAnesthesia={setIsRiskAnesthesia}
              isNPO={isNPO}
              setIsNPO={setIsNPO}
              isAggressive={isAggressive}
              setIsAggressive={setIsAggressive}
              isEscapePotential={isEscapePotential}
              setIsEscapePotential={setIsEscapePotential}
              isCerenia={isCerenia}
              setIsCerenia={setIsCerenia}
              isConvenia={isConvenia}
              setIsConvenia={setIsConvenia}
              isAllergic={isAllergic}
              setIsAllergic={setIsAllergic}
              isProcedure={isProcedure}
              setIsProcedure={setIsProcedure}
            />
            {!isEdit && (
              <button
                type="submit"
                className="btn btn-small save-entity-form-btn new-patient-form-btn"
              >
                שמור
              </button>
            )}
            {isEdit && (
              <SavePatientDailyDetailsSection
                formData={formData}
                animalTypes={animalTypes}
                selectedAnimalType={selectedAnimalType}
                caseDetailsList={caseDetailsList}
                showCaseDetailsDaysOptions={showCaseDetailsDaysOptions}
                selectedCaseDate={selectedCaseDate}
                setSelectedCaseDate={setSelectedCaseDate}
                onCaseDateChange={handleCaseDateChange}
                handleInputChange={handleInputChange}
                isSaveButtonsDisabled={isSaveButtonsDisabled}
                paintingMode={paintingMode}
                editableFieldsMode={editableFieldsMode}
                disableAddCaseDetailsTable={disableAddCaseDetailsTable}
                handlePaintingModeButtonClick={handlePaintingModeButtonClick}
                handleSetEditableFieldsButtonClick={
                  handleSetEditableFieldsButtonClick
                }
                addNewCaseDailyDetails={addNewCaseDailyDetails}
              />
            )}
            {isEdit && (
              <CaseDetailsTable
                caseDetailsList={caseDetailsList}
                setCaseDetailsList={setCaseDetailsList}
                caseDetailsDataIndex={caseDetailsDataIndex}
                handleCellClick={handleCellClick}
                paintingMode={paintingMode}
                animalWeight={formData.patientSnapshot?.weightKg}
                animalId={selectedAnimalType}
                selectedStartHour={selectedStartHour}
                setSelectedStartHour={setTimeSelectionValue}
              />
            )}
          </form>
        </div>
      )}
      <SavePatientModals
        isEdit={isEdit}
        caseIdString={caseIdString}
        caseSerialId={formData.caseId ?? ""}
        patientId={patientId}
        weightKg={formData.patientSnapshot?.weightKg}
        catheterDate={
          formData.dates?.catheterDate instanceof Date
            ? formData.dates.catheterDate.toISOString().split("T")[0]
            : null
        }
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
