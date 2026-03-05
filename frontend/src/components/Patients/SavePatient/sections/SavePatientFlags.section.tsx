import FormCheckbox from "../../../../utils/FormCheckbox/FormCheckbox";

interface SavePatientFlagsSectionProps {
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
}

function SavePatientFlagsSection({
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
}: SavePatientFlagsSectionProps) {
  return (
    <>
      <FormCheckbox labelText="AMB" checked={isAMB} setChecked={setIsAMB} />
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
      <FormCheckbox labelText="NPO" checked={isNPO} setChecked={setIsNPO} />
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
    </>
  );
}

export default SavePatientFlagsSection;
