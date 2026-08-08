import { useRef } from "react";
import { FaCamera } from "react-icons/fa";
import DatePicker from "../../../../utils/DatePicker/DatePicker";
import FormInput from "../../../../utils/FormInput/FormInput";
import FormSelect from "../../../../utils/FormSelect/FormSelect";
import FormTextarea from "../../../../utils/FormTextarea/FormTextarea";
import FormUploadImage from "../../../../utils/FormUploadImage/FormUploadImage";
import { getFormattedDateFromDBdate } from "../../../../utils/DateFormattingUtil";
import {
  SAVE_PATIENT_DEFAULTS,
  SAVE_PATIENT_CATHETER_DATE_FIELD_NAME,
  SAVE_PATIENT_PROCEDURE_DATE_FIELD_NAME,
} from "../constants/savePatient.constants";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import type { NewPatientData } from "../types/savePatient.types";
import type { SavePatientInputChangeHandler } from "./types/savePatientSections.types";
import SavePatientFlagsSection from "./SavePatientFlags.section";
import SavePatientActionsMenu, {
  type SavePatientActions,
} from "./SavePatientActionsMenu";
import {
  getPatientImageSrc,
  handlePatientImageLoadError,
} from "../../../../features/patients/utils/patientImage.utils";

interface SavePatientPatientInfoSectionProps {
  isEdit: boolean;
  formData: NewPatientData;
  handleInputChange: SavePatientInputChangeHandler;
  selectedFile?: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  photoName?: string;
  insuranceList: SelectOptionObj[];
  selectedInsurance: string;
  setSelectedInsurance: React.Dispatch<React.SetStateAction<string>>;
  genderTypes: SelectOptionObj[];
  selectedGenderType: string;
  setSelectedGenderType: React.Dispatch<React.SetStateAction<string>>;
  animalTypes: SelectOptionObj[];
  selectedAnimalType: string;
  setSelectedAnimalType: React.Dispatch<React.SetStateAction<string>>;
  raceTypes: SelectOptionObj[];
  selectedRaceType: string;
  setSelectedRaceType: React.Dispatch<React.SetStateAction<string>>;
  animalColors: SelectOptionObj[];
  selectedAnimalColor: string;
  setSelectedAnimalColor: React.Dispatch<React.SetStateAction<string>>;
  doctors: SelectOptionObj[];
  selectedDoctor: string;
  setSelectedDoctor: React.Dispatch<React.SetStateAction<string>>;
  nurses: SelectOptionObj[];
  selectedNurse: string;
  setSelectedNurse: React.Dispatch<React.SetStateAction<string>>;
  foodTypes: SelectOptionObj[];
  selectedFoodType: string;
  setSelectedFoodType: React.Dispatch<React.SetStateAction<string>>;
  getRaceTypes: (animalId: number | string) => void;
  isAMB: boolean;
  setIsAMB: React.Dispatch<React.SetStateAction<boolean>>;
  isHeartMurmur: boolean;
  setIsHeartMurmur: React.Dispatch<React.SetStateAction<boolean>>;
  isRiskAnesthesia: boolean;
  setIsRiskAnesthesia: React.Dispatch<React.SetStateAction<boolean>>;
  isNPO: boolean;
  setIsNPO: React.Dispatch<React.SetStateAction<boolean>>;
  isAggressive: boolean;
  setIsAggressive: React.Dispatch<React.SetStateAction<boolean>>;
  isEscapePotential: boolean;
  setIsEscapePotential: React.Dispatch<React.SetStateAction<boolean>>;
  isCerenia: boolean;
  setIsCerenia: React.Dispatch<React.SetStateAction<boolean>>;
  isConvenia: boolean;
  setIsConvenia: React.Dispatch<React.SetStateAction<boolean>>;
  isAllergic: boolean;
  setIsAllergic: React.Dispatch<React.SetStateAction<boolean>>;
  isProcedure: boolean;
  setIsProcedure: React.Dispatch<React.SetStateAction<boolean>>;
  editActions: SavePatientActions;
}

function SavePatientPatientInfoSection({
  isEdit,
  formData,
  handleInputChange,
  selectedFile,
  setSelectedFile,
  photoName,
  insuranceList,
  selectedInsurance,
  setSelectedInsurance,
  genderTypes,
  selectedGenderType,
  setSelectedGenderType,
  animalTypes,
  selectedAnimalType,
  setSelectedAnimalType,
  raceTypes,
  selectedRaceType,
  setSelectedRaceType,
  animalColors,
  selectedAnimalColor,
  setSelectedAnimalColor,
  doctors,
  selectedDoctor,
  setSelectedDoctor,
  nurses,
  selectedNurse,
  setSelectedNurse,
  foodTypes,
  selectedFoodType,
  setSelectedFoodType,
  getRaceTypes,
  isAMB,
  setIsAMB,
  isHeartMurmur,
  setIsHeartMurmur,
  isRiskAnesthesia,
  setIsRiskAnesthesia,
  isNPO,
  setIsNPO,
  isAggressive,
  setIsAggressive,
  isEscapePotential,
  setIsEscapePotential,
  isCerenia,
  setIsCerenia,
  isConvenia,
  setIsConvenia,
  isAllergic,
  setIsAllergic,
  isProcedure,
  setIsProcedure,
  editActions,
}: SavePatientPatientInfoSectionProps) {
  const currentPatientImage = isEdit ? getPatientImageSrc(photoName) : "#";
  const getOptionText = (options: SelectOptionObj[], value: string): string =>
    options.find((option) => option.value === value)?.text || "-";
  const patientAge = [
    formData.patientSnapshot?.ageYears
      ? `${formData.patientSnapshot.ageYears} שנים`
      : "",
    formData.patientSnapshot?.ageMonths
      ? `${formData.patientSnapshot.ageMonths} חודשים`
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  const summaryItems = [
    { label: "בעלים", value: formData.owner.name || "-" },
    { label: "טלפון", value: formData.owner.phone || "-" },
    { label: "סוג", value: getOptionText(animalTypes, selectedAnimalType) },
    { label: "גזע", value: getOptionText(raceTypes, selectedRaceType) },
    { label: "מין", value: getOptionText(genderTypes, selectedGenderType) },
    {
      label: "משקל",
      value: formData.patientSnapshot?.weightKg
        ? `${formData.patientSnapshot.weightKg} ק\"ג`
        : "-",
    },
    { label: "גיל", value: patientAge || "-" },
    { label: "רופא/ה", value: getOptionText(doctors, selectedDoctor) },
    { label: "אח/ות", value: getOptionText(nurses, selectedNurse) },
    {
      label: "קטטר",
      value:
        getFormattedDateFromDBdate(
          formData.dates?.catheterDate instanceof Date
            ? formData.dates.catheterDate
            : null,
        ) || "-",
    },
  ];
  const activeFlags = [
    isAMB ? "AMB" : "",
    isHeartMurmur ? "רשרוש לב" : "",
    isRiskAnesthesia ? "סיכון הרדמה" : "",
    isNPO ? "NPO" : "",
    isAggressive ? "אגרסיבי" : "",
    isEscapePotential ? "חשש בריחה" : "",
    isCerenia ? "Cerenia" : "",
    isConvenia ? "Convenia" : "",
    isAllergic ? "אלרגיה" : "",
    isProcedure ? "פרוצדורה" : "",
  ].filter(Boolean);

  return (
    <section className="new-patient-form-data-section">
      {isEdit && (
        <section
          className="edit-patient-mobile-summary"
          aria-label="פרטי מטופל"
        >
          <div className="edit-patient-mobile-summary__main">
            <div className="edit-patient-mobile-summary__image-wrapper">
              <FormUploadImage
                uploadedImageId="save-patient-img-mobile"
                isLarge={false}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                currentImage={currentPatientImage}
                isDefault={isEdit}
                imageClickAction="choice"
              />
              <div className="edit-patient-mobile-summary__image-edit-icon">
                <FaCamera />
              </div>
            </div>
            <div className="edit-patient-mobile-summary__identity">
              <h2>{formData.name || "מטופל"}</h2>
              <span>תיק {formData.caseId || "-"}</span>
            </div>
            <SavePatientActionsMenu
              actions={editActions}
              menuId="edit-patient-mobile-actions-panel"
              variant="mobile"
              showBackAction
            />
          </div>
          <dl className="edit-patient-mobile-summary__grid">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="edit-patient-mobile-summary__item"
              >
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          {formData.admission?.hospitalizationReason && (
            <p className="edit-patient-mobile-summary__reason">
              {formData.admission.hospitalizationReason}
            </p>
          )}
          {activeFlags.length > 0 && (
            <div className="edit-patient-mobile-summary__flags">
              {activeFlags.map((flag) => (
                <span key={flag}>{flag}</span>
              ))}
            </div>
          )}
        </section>
      )}
      <section
        className={`${isEdit ? "edit" : "new"}-patient-form-image-section`}
      >
        <FormUploadImage
          uploadedImageId="save-patient-img"
          isLarge={true}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          currentImage={currentPatientImage}
          isDefault={isEdit}
        />
      </section>
      <section
        className={`${isEdit ? "edit" : "new"}-patient-form-info-section`}
      >
        <FormInput
          labelText=":שם מטופל"
          name="name"
          isRequired={true}
          state={formData.name}
          setState={handleInputChange}
        />
        <FormInput
          labelText=":מספר תיק"
          name="caseId"
          isRequired={true}
          state={formData.caseId}
          setState={handleInputChange}
          type="text"
          disabled={isEdit}
        />
        <FormInput
          labelText=":שם בעלים"
          name="owner.name"
          isRequired={true}
          state={formData.owner.name}
          setState={handleInputChange}
        />
        <FormInput
          labelText=":מספר טלפון"
          name="owner.phone"
          isRequired={true}
          state={formData.owner.phone}
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
          name="patientSnapshot.weightKg"
          isRequired={true}
          state={formData.patientSnapshot?.weightKg}
          setState={handleInputChange}
          type="number"
          min={0}
        />
        <div className="patient-age-container form-input-container">
          <div className="patient-age-inputs">
            <FormInput
              labelText=":(חודשים) גיל"
              name="patientSnapshot.ageMonths"
              state={formData.patientSnapshot?.ageMonths}
              setState={handleInputChange}
              type="number"
              min={0}
              max={11}
              width="49%"
            />
            <FormInput
              labelText=":(שנים) גיל"
              name="patientSnapshot.ageYears"
              state={formData.patientSnapshot?.ageYears}
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
            setSelectedRaceType(SAVE_PATIENT_DEFAULTS.EMPTY_VALUE);
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
          searchable
        />
        <FormSelect
          elements={nurses}
          optionState={selectedNurse}
          setOptionState={setSelectedNurse}
          isRequired={true}
          selectId="new-patient-select-nurse"
          labelText=":אח/ות מטפל/ת"
          searchable
        />
        <FormInput
          labelText=":רופא מפנה"
          name="admission.referringDoctor"
          state={formData.admission?.referringDoctor ?? ""}
          setState={handleInputChange}
        />
        <FormInput
          labelText=":IDEXX לינק"
          name="admission.bloodTestLink"
          state={formData.admission?.bloodTestLink ?? ""}
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
          name={SAVE_PATIENT_CATHETER_DATE_FIELD_NAME}
          state={formData.dates?.catheterDate ?? null}
          setState={handleInputChange}
        />
        <DatePicker
          labelText=":תאריך פרוצדורה"
          name={SAVE_PATIENT_PROCEDURE_DATE_FIELD_NAME}
          state={formData.dates?.procedureDate ?? null}
          setState={handleInputChange}
          afterChange={(value) => {
            setIsProcedure(value !== null && value !== "");
          }}
        />
        <FormTextarea
          labelText=":סיבת האישפוז"
          name="admission.hospitalizationReason"
          isRequired={true}
          state={formData.admission?.hospitalizationReason ?? ""}
          setState={handleInputChange}
          height="70px"
          maxLength={300}
        />
        <FormTextarea
          labelText=":אלרגיה הערות"
          name="admission.allergicComments"
          state={formData.admission?.allergicComments ?? ""}
          setState={handleInputChange}
          height="70px"
          maxLength={300}
        />
        <div className={`${isEdit ? "edit" : "new"}-patient-form-checkboxes`}>
          <SavePatientFlagsSection
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
        </div>
      </section>
    </section>
  );
}

export default SavePatientPatientInfoSection;
