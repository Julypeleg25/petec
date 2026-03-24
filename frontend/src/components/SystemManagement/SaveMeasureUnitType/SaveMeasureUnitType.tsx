import { useState } from "react";
import { ISaveSystemProps } from "../SystemManagement";
import "./SaveMeasureUnitType.css"
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";

interface SaveMeasureUnitTypeData {
    name: string;
  }

function SaveMeasureUnitType({
    systemTypeObj,
    setShowSaveSystemType,
  }: ISaveSystemProps) {
    const isEdit = systemTypeObj !== undefined;
  
    const [formData, setFormData] = useState<SaveMeasureUnitTypeData>({
      name: isEdit ? systemTypeObj.name : "",
    });
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };
  
    const saveMeasureUnitType = async (e: React.FormEvent) => {
      e.preventDefault();
  
      if (isEdit) {
        await makeRequest(
          "PUT",
          globals.admin.measureUnitType.edit,
          {
            id: systemTypeObj.id,
            name: formData.name,
          },
          true,
          () => setShowSaveSystemType(false),
          undefined,
          undefined,
          "...מעדכן סוג מידה",
          "סוג מידה עודכן בהצלחה"
        );
      } else {
        await makeRequest(
          "POST",
          globals.admin.measureUnitType.new,
          {
            name: formData.name,
          },
          true,
          () => setShowSaveSystemType(false),
          undefined,
          undefined,
          "...יוצר סוג מידה",
          "סוג מידה נוצר בהצלחה"
        );
      }
    };
  
    return (
      <div className="SaveMeasureUnitType">
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
            {isEdit ? "עריכת סוג מידה" : "הוספת סוג מידה"}
          </h2>
          <form className="save-entity-form" onSubmit={(e) => saveMeasureUnitType(e)}>
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

export default SaveMeasureUnitType
