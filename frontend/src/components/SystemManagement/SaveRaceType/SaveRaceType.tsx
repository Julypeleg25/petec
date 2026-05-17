import SystemTypeForm from "../SystemTypeForm/SystemTypeForm";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator.types";

interface SaveRaceTypeProps {
  systemTypeObj: RowData | null;
  setShowSaveSystemType: (show: boolean) => void;
}

export default function SaveRaceType({
  systemTypeObj,
  setShowSaveSystemType,
}: SaveRaceTypeProps) {
  return (
    <SystemTypeForm
      systemTypeKey="raceTypes"
      systemTypeObj={systemTypeObj ?? undefined}
      onClose={() => setShowSaveSystemType(false)}
    />
  );
}
