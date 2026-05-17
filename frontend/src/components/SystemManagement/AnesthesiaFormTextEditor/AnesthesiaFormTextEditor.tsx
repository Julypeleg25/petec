import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { useSystemTypes, systemTypeKeys, systemTypesApi } from "../../../features/system-management";
import "./AnesthesiaFormTextEditor.css";

type AnesthesiaTextItem = {
  id: string;
  name: string;
  serialId?: string;
};

const sortAnesthesiaTextItems = (
  items: ReadonlyArray<AnesthesiaTextItem>,
): AnesthesiaTextItem[] =>
  [...items].sort((left, right) => {
    const leftSerial = Number.parseInt(left.serialId ?? "", 10);
    const rightSerial = Number.parseInt(right.serialId ?? "", 10);
    const hasLeftSerial = Number.isFinite(leftSerial);
    const hasRightSerial = Number.isFinite(rightSerial);

    if (hasLeftSerial && hasRightSerial && leftSerial !== rightSerial) {
      return leftSerial - rightSerial;
    }
    if (hasLeftSerial !== hasRightSerial) {
      return hasLeftSerial ? -1 : 1;
    }

    return left.id.localeCompare(right.id);
  });

const mergeAnesthesiaTextItems = (
  items: ReadonlyArray<AnesthesiaTextItem>,
): string =>
  sortAnesthesiaTextItems(items)
    .map((item) => item.name.trim())
    .filter((value) => value.length > 0)
    .join("\n\n");

export default function AnesthesiaFormTextEditor() {
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading } = useSystemTypes(
    SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS,
  );
  const [textValue, setTextValue] = useState("");
  const [initialTextValue, setInitialTextValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const merged = mergeAnesthesiaTextItems(rows);
    setTextValue(merged);
    setInitialTextValue(merged);
  }, [rows]);

  const hasChanges = useMemo(
    () => textValue.trim() !== initialTextValue.trim(),
    [initialTextValue, textValue],
  );

  const saveText = async () => {
    const normalizedText = textValue.trim();
    if (normalizedText.length === 0) {
      toast.error("יש להזין טקסט");
      return;
    }

    setIsSaving(true);
    try {
      const sortedRows = sortAnesthesiaTextItems(rows);
      const primaryRow = sortedRows[0];

      if (!primaryRow) {
        await systemTypesApi.create(SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS, {
          name: normalizedText,
          serialId: "1",
        });
      } else {
        await systemTypesApi.update(
          SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS,
          primaryRow.id,
          {
            name: normalizedText,
            serialId: "1",
          },
        );

        for (const extraRow of sortedRows.slice(1)) {
          await systemTypesApi.delete(
            SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS,
            extraRow.id,
          );
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: systemTypeKeys.list(SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS),
        }),
        queryClient.invalidateQueries({
          queryKey: systemTypeKeys.active(SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS),
        }),
      ]);

      setInitialTextValue(normalizedText);
      setTextValue(normalizedText);
      toast.success("טקסט טופס ההרדמה נשמר בהצלחה");
    } catch {
      toast.error("שמירת הטקסט נכשלה");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="anesthesia-text-editor-card" dir="rtl">
        <p className="anesthesia-text-editor-loading">טוען טקסט...</p>
      </div>
    );
  }

  return (
    <div className="anesthesia-text-editor-card" dir="rtl">
      <h3 className="anesthesia-text-editor-title">טקסט טופס הרדמה</h3>
      <textarea
        className="anesthesia-text-editor-textarea"
        value={textValue}
        onChange={(event) => setTextValue(event.target.value)}
        placeholder="הזן את טקסט טופס ההרדמה"
        rows={14}
      />

      <div className="anesthesia-text-editor-actions">
        <button
          type="button"
          className="btn btn-large"
          disabled={!hasChanges || isSaving}
          onClick={saveText}
        >
          {isSaving ? "...שומר" : "שמור"}
        </button>
      </div>
    </div>
  );
}
