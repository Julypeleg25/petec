import { useState } from "react";
import { ISaveSystemProps } from "../SystemManagement";
import "./SaveInsuranceType.css"
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";

interface SaveInsuranceTypeData {
    name: string;
}

function SaveInsuranceType({
    systemTypeObj,
    setShowSaveSystemType,
  }: ISaveSystemProps) {
    const isEdit = systemTypeObj !== undefined;
  
    const [formData, setFormData] = useState<SaveInsuranceTypeData>({
      name: isEdit ? systemTypeObj.name : "",
    });
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };
  
    const saveInsuranceTypeData = async (e: React.FormEvent) => {
      e.preventDefault();
  
      if (isEdit) {
        await makeRequest(
          "PUT",
          globals.admin.insuranceType.edit,
          {
            id: systemTypeObj.id,
            name: formData.name,
          },
          true,
          () => setShowSaveSystemType(false),
          undefined,
          undefined,
          "...מעדכן סוג ביטוח",
          "סוג ביטוח עודכן בהצלחה"
        );
      } else {
        await makeRequest(
          "POST",
          globals.admin.insuranceType.new,
          {
            name: formData.name,
          },
          true,
          () => setShowSaveSystemType(false),
          undefined,
          undefined,
          "...יוצר סוג ביטוח",
          "סוג ביטוח נוצר בהצלחה"
        );
      }
    };
  
    return (
      <div className="SaveInsuranceType">
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
            {isEdit ? "עריכת סוג ביטוח" : "הוספת סוג ביטוח"}
          </h2>
          <form className="save-entity-form" onSubmit={(e) => saveInsuranceTypeData(e)}>
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

export default SaveInsuranceType
