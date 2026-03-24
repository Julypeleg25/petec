import { useState } from "react";
import { ISaveSystemProps } from "../SystemManagement";
import "./SaveDosageFrequencyType.css"
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";

interface DosageFrequencyTypeData {
    name: string;
    description: string;
    descriptionPerHour: string;
  }

function SaveDosageFrequencyType({
    systemTypeObj,
    setShowSaveSystemType,
  }: ISaveSystemProps) {
    const isEdit = systemTypeObj !== undefined;
  
    const [formData, setFormData] = useState<DosageFrequencyTypeData>({
      name: isEdit ? systemTypeObj.name : "",
      description: isEdit ? systemTypeObj.description : "",
      descriptionPerHour: isEdit ? systemTypeObj.description_per_hour : "",
    });
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };
  
    const saveDosageFrequencyType = async (e: React.FormEvent) => {
      e.preventDefault();
  
      if (isEdit) {
        await makeRequest(
          "PUT",
          globals.admin.dosageFrequencyType.edit,
          {
            id: systemTypeObj.id,
            name: formData.name,
            description: formData.description,
            descriptionPerHour: formData.descriptionPerHour,
          },
          true,
          () => setShowSaveSystemType(false),
          undefined,
          undefined,
          "...מעדכן סוג תדירות",
          "סוג תדירות עודכן בהצלחה"
        );
      } else {
        await makeRequest(
          "POST",
          globals.admin.dosageFrequencyType.new,
          {
            name: formData.name,
            description: formData.description,
            descriptionPerHour: formData.descriptionPerHour,
          },
          true,
          () => setShowSaveSystemType(false),
          undefined,
          undefined,
          "...יוצר סוג תדירות",
          "סוג תדירות נוצר בהצלחה"
        );
      }
    };
  
    return (
      <div className="SaveDosageFrequencyType">
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
            {isEdit ? "עריכת סוג תדירות" : "הוספת סוג תדירות"}
          </h2>
          <form className="save-entity-form" onSubmit={(e) => saveDosageFrequencyType(e)}>
            <FormInput
              labelText=":שם"
              name="name"
              placeholder="שם"
              isRequired={true}
              state={formData.name}
              setState={handleInputChange}
              minLength={1}
            />
            <FormInput
              labelText=":תיאור"
              name="description"
              placeholder="תיאור"
              isRequired={true}
              state={formData.description}
              setState={handleInputChange}
              minLength={1}
              maxLength={100}
            />
            <FormInput
              labelText=":תיאור לפי שעה"
              name="descriptionPerHour"
              placeholder="תיאור לפי שעה"
              isRequired={true}
              state={formData.descriptionPerHour}
              setState={handleInputChange}
              minLength={1}
              maxLength={100}
            />
            <button type="submit" className="btn btn-large save-entity-form-btn">
              שמור
            </button>
          </form>
        </div>
      </div>
    );
  }

export default SaveDosageFrequencyType
