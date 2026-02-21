import { useEffect, useRef, useState } from "react";
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

import { AnesthesiaProcedureFormProps, AnesthesiaProcedureFormData } from "./AnesthesiaProcedureForm.types";

function AnesthesiaProcedureForm({ caseId, masterCaseId }: AnesthesiaProcedureFormProps) {
  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 200;

  const [formData, setFormData] = useState<AnesthesiaProcedureFormData>({
    ownerName: "",
    name: "",
    plannedProcedure: "",
    priceEstimate: 0,
    date: null,
    generalComments: null,
    distortionComments: null,
    medicationsSensitiveComments: null,
  });
  const [isFastSinceMidnight, setIsFastSinceMidnight] = useState<
    boolean | null
  >(null);
  const [isDistortionHistory, setIsDistortionHistory] = useState<
    boolean | null
  >(null);
  const [isMedicationsSensitive, setIsMedicationsSensitive] = useState<
    boolean | null
  >(null);
  const [isNeedToMarkEar, setIsNeedToMarkEar] = useState<boolean | null>(null);
  const [isSterilization, setIsSterilization] = useState<boolean | null>(null);
  const [
    isPriceIncludesReleaseMedications,
    setIsPriceIncludesReleaseMedications,
  ] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEdit, setIsEdit] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const saveAnesthesiaProcedureForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error("אנא חתום על המסמך");
      return;
    }

    const requestBody = {
      name: formData.name,
      ownerName: formData.ownerName,
      plannedProcedure: formData.plannedProcedure,
      priceEstimate: formData.priceEstimate,
      date: formData.date,
      isFastSinceMidnight: isFastSinceMidnight,
      isDistortionHistory: isDistortionHistory,
      isMedicationsSensitive: isMedicationsSensitive,
      isNeedToMarkEar: isNeedToMarkEar,
      isSterilization: isSterilization,
      isPriceIncludesReleaseMedications: isPriceIncludesReleaseMedications,
      generalComments: formData.generalComments,
      distortionComments: formData.distortionComments,
      medicationsSensitiveComments: formData.medicationsSensitiveComments,
      caseId: caseId,
      signature: signatureRef.current?.toDataURL(),
    };

    try {
      await patientsApi.upsertAnesthesiaForm(caseId, {
        ...requestBody,
        caseId,
        date: requestBody.date ? new Date(requestBody.date) : undefined,
      } as Parameters<typeof patientsApi.upsertAnesthesiaForm>[1]);
      toast.success("הפרטים נשמרו בהצלחה");
      if (!isEdit) setIsEdit(true);
    } catch {
      toast.error("שגיאה בשמירת הטופס");
    }
  };

  const getCaseAnesthesiaProcedureForm = async () => {
    try {
      const data = await patientsApi.getAnesthesiaForm(caseId);
      if (data) {
        setIsEdit(true);
        setFormData({
          name: data.name ?? "",
          ownerName: data.ownerName ?? "",
          plannedProcedure: data.plannedProcedure ?? "",
          priceEstimate: data.priceEstimate ? Number(data.priceEstimate) : 0,
          date: data.date ? (data.date as unknown as string) : null,
          generalComments: data.generalComments ?? null,
          distortionComments: data.distortionComments ?? null,
          medicationsSensitiveComments: data.medicationsSensitiveComments ?? null,
        });
        setIsFastSinceMidnight(data.isFastSinceMidnight ?? null);
        setIsDistortionHistory(data.isDistortionHistory ?? null);
        setIsMedicationsSensitive(data.isMedicationsSensitive ?? null);
        setIsNeedToMarkEar(data.isNeedToMarkEar ?? null);
        setIsSterilization(data.isSterilization ?? null);
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
    } catch { /* handled by interceptor */ }
  };

  const clearSignature = (e: React.MouseEvent) => {
    e.preventDefault();
    signatureRef.current?.clear();
  };

  useEffect(() => {
    getCaseAnesthesiaProcedureForm();
  }, []);

  return (
    <div
      className="save-entity-form-container save-anesthesia-procedure-form-container"
      style={{ maxWidth: "90%" }}
    >
      <form
        className="save-entity-form save-anesthesia-procedure-form"
        onSubmit={(e) => saveAnesthesiaProcedureForm(e)}
      >
        <FormInput
          labelText=":שם בעלים"
          name="ownerName"
          isRequired={true}
          state={formData.ownerName}
          setState={handleInputChange}
          minLength={1}
        />
        <FormInput
          labelText=":שם בעל חיים"
          name="name"
          isRequired={true}
          state={formData.name}
          setState={handleInputChange}
          minLength={1}
        />
        <FormInput
          labelText=":מספר תיק"
          name="caseId"
          disabled={true}
          state={masterCaseId}
          minLength={1}
        />
        <FormRadio
          labelText="?האם בעל החיים היה בצום הכל מחצות"
          optionValue={isFastSinceMidnight}
          setOptionValue={setIsFastSinceMidnight}
        />
        <FormRadio
          labelText="?האם לבעל החיים היסטוריה של עוויתות"
          optionValue={isDistortionHistory}
          setOptionValue={setIsDistortionHistory}
        />
        <FormTextarea
          name="distortionComments"
          state={formData.distortionComments}
          setState={handleInputChange}
          maxLength={300}
        />
        <FormRadio
          labelText="?האם ידועה רגישות של בעל החיים לתרופות כלשהן"
          optionValue={isMedicationsSensitive}
          setOptionValue={setIsMedicationsSensitive}
        />
        <FormTextarea
          name="medicationsSensitiveComments"
          state={formData.medicationsSensitiveComments}
          setState={handleInputChange}
          maxLength={300}
        />
        <FormRadio
          labelText="?חתול לעיקור/חתול לסירוס - האם יש צורך לסמן אוזן"
          optionValue={isNeedToMarkEar}
          setOptionValue={setIsNeedToMarkEar}
        />
        <FormRadio
          labelText="במקרה של כלבה - אני מאשר/ת שאינה בייחום"
          optionValue={isSterilization}
          setOptionValue={setIsSterilization}
        />
        <FormTextarea
          labelText=":הערות"
          name="generalComments"
          state={formData.generalComments}
          setState={handleInputChange}
          height={"70px"}
          maxLength={300}
        />
        <FormInput
          labelText=":הפרוצדורה המתוכננת"
          name="plannedProcedure"
          state={formData.plannedProcedure}
          setState={handleInputChange}
          minLength={1}
        />
        <div className="anesthesia-procedure-form-price-details">
          <FormInput
            type="number"
            labelText=":הערכת מחיר"
            name="priceEstimate"
            state={formData.priceEstimate}
            setState={handleInputChange}
            min={0}
          />
          <FormCheckbox
            labelText="כולל תרופות לשחרור"
            checked={isPriceIncludesReleaseMedications}
            setChecked={setIsPriceIncludesReleaseMedications}
          />
        </div>
        <div className="anesthesia-procedure-form-text">
          <p>
            חומרי הרדמה נחשבים בטוחים, עם זאת תמיד קיים סיכון בהרדמה ובפרוצדרות
            כירורגיות, ולרופא/מרפאה אין יכולת לחזות או לקחת אחריות במידה ולבעל
            החיים תהייה תגובה שלילית להרדמה.
          </p>
          <p>
            בחתימה על מסמך זה הנני מסכים/ה לביצוע ההרדמה והפרצדורות הכירורגיות
            הנדרשות בחירום או על פי תיאום מראש, זאת לאחר שהוסברו לי כלל הסיכונים
            הכרוכים בכך.
          </p>
          <p>
            הנני מאשר שהובא לידיעתי הערכת מחיר זו וכי ידוע לי שעשויה להיות סטייה
            של עד 15% מהערכה זו. במידה ובמהלך הטיפול התעורר צורך בטיפולים נוספים
            שיגרמו למחיר לעלות{" "}
            <span style={{ textDecoration: "underline" }}>ביותר מ 15%</span>, כי
            אז יעדכן הרופא טלפונית לקבלת אישורי.
          </p>
          <p>
            הנני מתחייב להסדיר את התשלום לפי הערכת המחיר הנ"ל, עם שחרור בעל
            החיים מהמרפאה. אני מבין ומודע לכך כי עלי להסדיר את התשלום, גם במידה
            ובעל החיים ימות במהלך הטיפול/אישפוז. אני מאשר כי קראתי, הוסבר לי
            והבנתי את הסיכונים.
          </p>
          <p>
            אני מודע לכך שהאישפוז אינו כולל השגחת לילה.
            <br /> במידה ובעל החיים נשאר לאישפוז לילה, אני מודע לכך שאין צוות
            רפואי נוכח בלילה.
          </p>
        </div>
        <label className="anesthesia-procedure-signature-label">
          <span>
            <FaEraser onClick={(e) => clearSignature(e)} />
          </span>
          <span>:חתימה</span>
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
        <DatePicker
          labelText=":תאריך"
          name="date"
          state={formData.date}
          setState={handleInputChange}
        />
        <button type="submit" className="btn btn-large save-entity-form-btn">
          שמור
        </button>
      </form>
    </div>
  );
}

export default AnesthesiaProcedureForm;
