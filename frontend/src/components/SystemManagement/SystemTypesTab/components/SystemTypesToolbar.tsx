import FormSelect from "../../../../utils/FormSelect/FormSelect";
import { SYSTEM_TYPE_OPTIONS } from "../SystemTypesTab.constants";
import { isSystemTypeKey, type SystemTypeKey } from "../SystemTypesTab.constants";

interface SystemTypesToolbarProps {
  systemType: SystemTypeKey;
  onSelectSystemType: (val: SystemTypeKey) => void;
}

export function SystemTypesToolbar({
  systemType,
  onSelectSystemType,
}: SystemTypesToolbarProps) {
  const currentSystemTypeLabel = SYSTEM_TYPE_OPTIONS.find(
    (option: { value: string; text: string }) => option.value === systemType,
  )?.text;

  return (
    <div className="system-types-toolbar" dir="rtl">
      <div className="system-types-toolbar__selector">
        <FormSelect
          elements={[...SYSTEM_TYPE_OPTIONS]}
          optionState={systemType}
          setOptionState={(val) => {
            if (isSystemTypeKey(val)) {
              onSelectSystemType(val);
            }
          }}
          width="260px"
          isRequired={true}
          selectId="system-type-select"
          labelText="סוג ישות"
        />
      </div>
      <p className="system-types-toolbar__selected-type">
        ישות פעילה: <span>{currentSystemTypeLabel ?? ""}</span>
      </p>
    </div>
  );
}
