import { useState } from "react";
import { ISaveSystemProps } from "../SystemManagement";
import "./SaveUrineType.css";
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";

interface UrineTypeData {
  name: string;
}

function SaveUrineType({
  systemTypeObj,
  setShowSaveSystemType,
}: ISaveSystemProps) {
  const isEdit = systemTypeObj !== undefined;

  const [formData, setFormData] = useState<UrineTypeData>({
    name: isEdit ? systemTypeObj.name : "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const saveUrineType = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      await makeRequest(
        "PUT",
        globals.admin.urineType.edit,
        {
          id: systemTypeObj.id,
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...מעדכן סוג שתן",
        "סוג השתן עודכן בהצלחה"
      );
    } else {
      await makeRequest(
        "POST",
        globals.admin.urineType.new,
        {
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...יוצר סוג שתן",
        "סוג השתן נוצר בהצלחה"
      );
    }
  };

  return (
    <div className="SaveUrineType">
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
          {isEdit ? "עריכת סוג שתן" : "הוספת סוג שתן"}
        </h2>
        <form className="save-entity-form" onSubmit={(e) => saveUrineType(e)}>
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

export default SaveUrineType;
