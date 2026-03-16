import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import FormInput from "../../utils/FormInput/FormInput";
import "./AnesthesiaProcedureForm.css";
import FormCheckbox from "../../utils/FormCheckbox/FormCheckbox";
import { patientsApi } from "../../features/patients/patients.api";
import DatePicker from "../../utils/DatePicker/DatePicker";
import SignatureCanvas from "react-signature-canvas";
import toast from "react-hot-toast";
import { FaEraser } from "react-icons/fa";
import FormRadio from "../../utils/FormRadio/FormRadio";
import FormTextarea from "../../utils/FormTextarea/FormTextarea";
import { getSharedResolver } from "../../utils/form";
import {
  AnesthesiaProcedureFormDTOSchema,
  SYSTEM_TYPE_NAMES,
} from "@petec/shared";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_ANESTHESIA_FORM_TEXT } from "./AnesthesiaProcedureForm.constants";
import type {
  AnesthesiaProcedureFormProps,
  AnesthesiaProcedureFormValues,
} from "./AnesthesiaProcedureForm.types";
import { useActiveSystemTypes } from "../../features/system-management";

type CreateAnesthesiaProcedureFormDTO =
  Parameters<typeof patientsApi.upsertAnesthesiaForm>[1];

export default function AnesthesiaProcedureForm({
  caseId,
  caseSerialId,
}: AnesthesiaProcedureFormProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [isPriceIncludesReleaseMedications, setIsPriceIncludesReleaseMedications] = useState(false);
  const { data: anesthesiaFormTexts = [] } = useActiveSystemTypes(
    SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS,
  );

  const resolvedAnesthesiaFormText = useMemo(() => {
    if (anesthesiaFormTexts.length === 0) {
      return DEFAULT_ANESTHESIA_FORM_TEXT;
    }
    const primaryText = anesthesiaFormTexts.find(
      (item) => item.serialId === "1" && item.name.trim().length > 0,
    );
    if (primaryText) {
      return primaryText.name.trim();
    }

    const firstNonEmptyText = anesthesiaFormTexts.find(
      (item) => item.name.trim().length > 0,
    );
    if (firstNonEmptyText) {
      return firstNonEmptyText.name.trim();
    }

    return DEFAULT_ANESTHESIA_FORM_TEXT;
  }, [anesthesiaFormTexts]);

  const anesthesiaFormTextParagraphs = useMemo(
    () =>
      resolvedAnesthesiaFormText
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0),
    [resolvedAnesthesiaFormText],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnesthesiaProcedureFormValues>({
    resolver: getSharedResolver(AnesthesiaProcedureFormDTOSchema),
    defaultValues: {
      ownerName: "",
      name: "",
      plannedProcedure: "",
      priceEstimate: 0,
      date: null,
      generalComments: null,
      distortionComments: null,
      medicationsSensitiveComments: null,
      isFastSinceMidnight: null,
      isDistortionHistory: null,
      isMedicationsSensitive: null,
      isNeedToMarkEar: null,
      isSterilization: null,
    },
  });

  const saveAnesthesiaProcedureForm = handleSubmit(async (values) => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("אנא חתום על המסמך");
      return;
    }

    const requestBody: CreateAnesthesiaProcedureFormDTO = {
      name: values.name,
      ownerName: values.ownerName,
      plannedProcedure: values.plannedProcedure,
      priceEstimate: values.priceEstimate,
      date: values.date ? new Date(values.date) : undefined,
      isFastSinceMidnight: values.isFastSinceMidnight ?? undefined,
      isDistortionHistory: values.isDistortionHistory ?? undefined,
      isMedicationsSensitive: values.isMedicationsSensitive ?? undefined,
      isNeedToMarkEar: values.isNeedToMarkEar ?? undefined,
      isSterilization: values.isSterilization ?? undefined,
      isPriceIncludesReleaseMedications: isPriceIncludesReleaseMedications,
      generalComments: values.generalComments ?? undefined,
      distortionComments: values.distortionComments ?? undefined,
      medicationsSensitiveComments: values.medicationsSensitiveComments ?? undefined,
      caseId: caseId,
      signature: signatureRef.current?.toDataURL(),
    };

    try {
      await patientsApi.upsertAnesthesiaForm(caseId, requestBody);
      toast.success("הפרטים נשמרו בהצלחה");
      if (!isEdit) setIsEdit(true);
    } catch {
      toast.error("שגיאה בשמירת הטופס");
    }
  }, (formErrors) => {
    const firstError = Object.values(formErrors)[0];
    if (firstError?.message) {
      toast.error(firstError.message.toString());
    }
  });

  const getCaseAnesthesiaProcedureForm = useCallback(async () => {
    try {
      const data = await patientsApi.getAnesthesiaForm(caseId);
      if (data) {
        const normalizedDate = data.date
          ? new Date(data.date).toISOString().split("T")[0]
          : null;
        setIsEdit(true);
        reset({
          name: data.name ?? "",
          ownerName: data.ownerName ?? "",
          plannedProcedure: data.plannedProcedure ?? "",
          priceEstimate: data.priceEstimate ? Number(data.priceEstimate) : 0,
          date: normalizedDate,
          generalComments: data.generalComments ?? null,
          distortionComments: data.distortionComments ?? null,
          medicationsSensitiveComments: data.medicationsSensitiveComments ?? null,
          isFastSinceMidnight: data.isFastSinceMidnight ?? null,
          isDistortionHistory: data.isDistortionHistory ?? null,
          isMedicationsSensitive: data.isMedicationsSensitive ?? null,
          isNeedToMarkEar: data.isNeedToMarkEar ?? null,
          isSterilization: data.isSterilization ?? null,
        });
        
        setIsPriceIncludesReleaseMedications(
          data.isPriceIncludesReleaseMedications ?? false
        );

        if (data.signature) {
          signatureRef.current?.fromDataURL(data.signature, {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
          });
        }
      }
    } catch {  }
  }, [caseId, reset]);

  const clearSignature = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    signatureRef.current?.clear();
  }, []);

  useEffect(() => {
    void getCaseAnesthesiaProcedureForm();
  }, [getCaseAnesthesiaProcedureForm]);

  return (
    <div
      className="save-entity-form-container save-anesthesia-procedure-form-container"
      dir="rtl"
      lang="he"
    >
      <form
        className="save-entity-form save-anesthesia-procedure-form"
        onSubmit={saveAnesthesiaProcedureForm}
        noValidate
        dir="rtl"
      >
        <div className="anesthesia-procedure-form-fields">
          <Controller
            name="ownerName"
            control={control}
            render={({ field }) => (
              <>
                <FormInput
                  labelText="שם בעלים:"
                  name={field.name}
                  isRequired={true}
                  state={field.value}
                  setState={field.onChange}
                  minLength={1}
                />
                {errors.ownerName && <p className="form-error">{errors.ownerName.message}</p>}
              </>
            )}
          />
          
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <>
                <FormInput
                  labelText="שם בעל חיים:"
                  name={field.name}
                  isRequired={true}
                  state={field.value}
                  setState={field.onChange}
                  minLength={1}
                />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </>
            )}
          />

          <FormInput
            labelText="מספר תיק:"
            name="caseId"
            disabled={true}
            state={caseSerialId}
            minLength={1}
          />

          <Controller
            name="isFastSinceMidnight"
            control={control}
            render={({ field }) => (
              <FormRadio
                labelText="?האם בעל החיים היה בצום הכל מחצות"
                optionValue={field.value ?? null}
                setOptionValue={field.onChange}
              />
            )}
          />

          <Controller
            name="isDistortionHistory"
            control={control}
            render={({ field }) => (
              <FormRadio
                labelText="?האם לבעל החיים היסטוריה של עוויתות"
                optionValue={field.value ?? null}
                setOptionValue={field.onChange}
              />
            )}
          />

          <Controller
            name="distortionComments"
            control={control}
            render={({ field }) => (
              <FormTextarea
                name={field.name}
                state={field.value ?? ""}
                setState={field.onChange}
                maxLength={300}
              />
            )}
          />

          <Controller
            name="isMedicationsSensitive"
            control={control}
            render={({ field }) => (
              <FormRadio
                labelText="?האם ידועה רגישות של בעל החיים לתרופות כלשהן"
                optionValue={field.value ?? null}
                setOptionValue={field.onChange}
              />
            )}
          />

          <Controller
            name="medicationsSensitiveComments"
            control={control}
            render={({ field }) => (
              <FormTextarea
                name={field.name}
                state={field.value ?? ""}
                setState={field.onChange}
                maxLength={300}
              />
            )}
          />

          <Controller
            name="isNeedToMarkEar"
            control={control}
            render={({ field }) => (
              <FormRadio
                labelText="?חתול לעיקור/חתול לסירוס - האם יש צורך לסמן אוזן"
                optionValue={field.value ?? null}
                setOptionValue={field.onChange}
              />
            )}
          />

          <Controller
            name="isSterilization"
            control={control}
            render={({ field }) => (
              <FormRadio
                labelText="במקרה של כלבה - אני מאשר/ת שאינה בייחום"
                optionValue={field.value ?? null}
                setOptionValue={field.onChange}
              />
            )}
          />

          <Controller
            name="generalComments"
            control={control}
            render={({ field }) => (
              <FormTextarea
                labelText=":הערות"
                name={field.name}
                state={field.value ?? ""}
                setState={field.onChange}
                height={"70px"}
                maxLength={300}
              />
            )}
          />

          <Controller
            name="plannedProcedure"
            control={control}
            render={({ field }) => (
              <>
                <FormInput
                  labelText="הפרוצדורה המתוכננת:"
                  name={field.name}
                  state={field.value}
                  setState={field.onChange}
                  minLength={1}
                />
                {errors.plannedProcedure && (
                  <p className="form-error">{errors.plannedProcedure.message}</p>
                )}
              </>
            )}
          />

          <div className="anesthesia-procedure-form-price-details">
            <Controller
              name="priceEstimate"
              control={control}
              render={({ field }) => (
                <>
                  <FormInput
                    type="number"
                    labelText="הערכת מחיר:"
                    name={field.name}
                    state={field.value?.toString() ?? ""}
                    setState={(val: string) => field.onChange(val === "" ? null : Number(val))}
                    min={0}
                  />
                  {errors.priceEstimate && (
                    <p className="form-error">{errors.priceEstimate.message}</p>
                  )}
                </>
              )}
            />
            <FormCheckbox
              labelText="כולל תרופות לשחרור"
              checked={isPriceIncludesReleaseMedications}
              setChecked={setIsPriceIncludesReleaseMedications}
            />
          </div>
        </div>

        <div className="anesthesia-procedure-form-text">
          {anesthesiaFormTextParagraphs.map((paragraph, index) => (
            <p key={`anesthesia-paragraph-${index}`} dir="rtl">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="anesthesia-procedure-form-fields">
          <label className="anesthesia-procedure-signature-label">
            <span>חתימה:</span>
            <span>
              <FaEraser onClick={clearSignature} />
            </span>
          </label>
          <SignatureCanvas
            ref={signatureRef}
            penColor="black"
            canvasProps={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              className: "anesthesia-procedure-signature",
            }}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <>
                <DatePicker
                  labelText="תאריך:"
                  name={field.name}
                  state={field.value ?? ""}
                  setState={field.onChange}
                />
                {errors.date && <p className="form-error">{errors.date.message}</p>}
              </>
            )}
          />
          
          <button type="submit" className="btn btn-large save-entity-form-btn">
            שמור
          </button>
        </div>
      </form>
    </div>
  );
}
