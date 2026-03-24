import { useState } from "react";
import { ISaveSystemProps } from "../SystemManagement";
import "./SaveProcedureType.css";
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";

interface ProcedureTypeData {
  name: string;
}

function SaveProcedureType({
  systemTypeObj,
  setShowSaveSystemType,
}: ISaveSystemProps) {
  const isEdit = systemTypeObj !== undefined;

  const [formData, setFormData] = useState<ProcedureTypeData>({
    name: isEdit ? systemTypeObj.name : "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const saveProcedureType = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      await makeRequest(
        "PUT",
        globals.admin.proceduresTypes.edit,
        {
          id: systemTypeObj.id,
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...מעדכן סוג פרוצדורה",
        "סוג פרוצדורה עודכנה בהצלחה"
      );
    } else {
      await makeRequest(
        "POST",
        globals.admin.proceduresTypes.new,
        {
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...יוצר סוג פרוצדורה",
        "סוג פרוצדורה נוצרה בהצלחה"
      );
    }
  };

  return (
    <div className="SaveProcedureType">
      <button
        className="btn btn-active btn-round back-btn"
        onClick={() => {
          setShowSaveSystemType(undefined);
        }}
      >
        <FaArrowRight />
      </button>
      <div className="save-entity-form-container">
        <h2 className="save-entity-form-title">
          {isEdit ? "עריכת סוג פרוצדורה" : "הוספת סוג פרוצדורה"}
        </h2>
        <form
          className="save-entity-form"
          onSubmit={(e) => saveProcedureType(e)}
        >
          <FormInput
            labelText=":שם"
            name="name"
            placeholder="שם"
            isRequired={true}
            state={formData.name}
            setState={handleInputChange}
            minLength={1}
          />
          <button type="submit" className="btn btn-large save-entity-form-btn">
            שמור
          </button>
        </form>
      </div>
    </div>
  );
}

export default SaveProcedureType;
