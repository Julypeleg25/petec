import { useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import toast from "react-hot-toast";
import {
  buildSystemTypeFormSchema,
} from "@petec/shared";
import {
  useCreateSystemType,
  useUpdateSystemType,
  type CreatePayload,
} from "../../../features/system-management/hooks/useSystemTypes";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator.types";
import { getSharedResolver } from "../../../utils/form";
import "./SystemTypeForm.css";

import { SYSTEM_TYPE_CONFIG, type SystemTypeFormKey } from "./SystemTypeForm.config";
import {
  buildSystemTypeInitialValues,
  buildSystemTypePayload,
  resolveSystemTypeRowId,
} from "./SystemTypeForm.utils";
import { SystemTypeEditorShell } from "../shared/SystemTypeEditorShell/SystemTypeEditorShell";
import { getSystemTypeRowName } from "../shared/systemTypeRow.utils";

import { SystemTypeField } from "./components/SystemTypeField";

interface SystemTypeFormProps {
  systemTypeKey: SystemTypeFormKey;
  systemTypeObj?: RowData;
  onClose: () => void;
}

type SystemTypeFormValues = Record<string, string>;

type SystemTypeFormContentProps = {
  config: (typeof SYSTEM_TYPE_CONFIG)[keyof typeof SYSTEM_TYPE_CONFIG];
  systemTypeObj?: RowData;
  onClose: () => void;
};

function SystemTypeFormContent({
  config,
  systemTypeObj,
  onClose,
}: SystemTypeFormContentProps) {
  const editId = resolveSystemTypeRowId(systemTypeObj);
  const isEdit = editId.trim().length > 0;
  const currentItemName = getSystemTypeRowName(systemTypeObj);

  const createMutation = useCreateSystemType(config.typeName);
  const updateMutation = useUpdateSystemType(config.typeName);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const formSchema = useMemo(
    () => buildSystemTypeFormSchema(config.fields),
    [config.fields],
  );

  const initialValues = useMemo(
    () => buildSystemTypeInitialValues(config.fields, systemTypeObj),
    [config.fields, systemTypeObj],
  );

  const methods = useForm<SystemTypeFormValues>({
    resolver: getSharedResolver(formSchema),
    defaultValues: initialValues,
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods;

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const handleMutationError = (error: Error, fallbackMessage: string) => {
    const message = error.message.trim().length > 0 ? error.message : fallbackMessage;
    toast.error(message);
  };

  const onSubmit = (values: SystemTypeFormValues) => {
    if (isEdit && !isDirty) {
      toast.error("לא בוצעו שינויים");
      return;
    }

    const payload = buildSystemTypePayload(config.fields, values);

    if (isEdit) {
      if (!editId) {
        toast.error("לא ניתן לערוך פריט ללא מזהה");
        return;
      }
      updateMutation.mutate(
        { id: editId, payload },
        {
          onSuccess: onClose,
          onError: (error: Error) =>
            handleMutationError(error, "שמירת השינויים נכשלה"),
        },
      );
    } else {
      createMutation.mutate(payload as CreatePayload, {
        onSuccess: onClose,
        onError: (error: Error) => handleMutationError(error, "יצירת הפריט נכשלה"),
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <SystemTypeEditorShell
        isEdit={isEdit}
        createTitle={config.createTitle}
        editTitle={config.editTitle}
        currentItemName={currentItemName}
        onClose={onClose}
        onSubmit={handleSubmit(onSubmit)}
        isPending={isPending}
        submitDisabled={isEdit && !isDirty}
        size="md"
      >
        {config.fields.map((field) => (
          <SystemTypeField
            key={field.name}
            field={field}
            isEdit={isEdit}
            isPending={isPending}
          />
        ))}
      </SystemTypeEditorShell>
    </FormProvider>
  );
}

export default function SystemTypeForm({
  systemTypeKey,
  systemTypeObj,
  onClose,
}: SystemTypeFormProps) {
  const config = SYSTEM_TYPE_CONFIG[systemTypeKey];
  if (!config) {
    return null;
  }

  return (
    <SystemTypeFormContent
      config={config}
      systemTypeObj={systemTypeObj}
      onClose={onClose}
    />
  );
}
