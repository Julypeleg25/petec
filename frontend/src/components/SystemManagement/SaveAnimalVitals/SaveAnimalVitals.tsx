import SystemTypeForm from "../SystemTypeForm/SystemTypeForm";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator.types";

interface SaveAnimalVitalsProps {
  systemTypeObj: RowData | null;
  setShowSaveSystemType: (show: boolean) => void;
}

function SaveAnimalVitals({
  systemTypeObj,
  setShowSaveSystemType,
}: SaveAnimalVitalsProps) {
  return (
    <SystemTypeForm
      systemTypeKey="animalVitals"
      systemTypeObj={systemTypeObj ?? undefined}
      onClose={() => setShowSaveSystemType(false)}
    />
  );
}

export default SaveAnimalVitals;
