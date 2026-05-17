import FormSelect from "../../../../utils/FormSelect/FormSelect";
import {
  SYSTEM_TYPE_OPTIONS,
  isSystemTypeKey,
  type SystemTypeKey,
} from "../SystemTypesTab.constants";

interface SystemTypesToolbarProps {
  systemType: SystemTypeKey;
  onSelectSystemType: (val: SystemTypeKey) => void;
}

export function SystemTypesToolbar({
  systemType,
  onSelectSystemType,
}: SystemTypesToolbarProps) {
  return (
    <div className="system-types-toolbar" dir="rtl">
      <FormSelect
        elements={[...SYSTEM_TYPE_OPTIONS]}
        optionState={systemType}
        setOptionState={(val) => {
          if (isSystemTypeKey(val)) {
            onSelectSystemType(val);
          }
        }}
        width="140px"
        selectId="system-type-select"
        labelText="סוג ישות"
      />
    </div>
  );
}
