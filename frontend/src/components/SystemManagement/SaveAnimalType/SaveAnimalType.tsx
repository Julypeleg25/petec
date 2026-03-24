import "./SaveAnimalType.css";
import { ISaveSystemProps } from "../SystemManagement";
import { useState } from "react";
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";

interface AnimalTypeData {
  name: string;
}

function SaveAnimalType({
  systemTypeObj,
  setShowSaveSystemType,
}: ISaveSystemProps) {
  const isEdit = systemTypeObj !== undefined;

  const [formData, setFormData] = useState<AnimalTypeData>({
    name: isEdit ? systemTypeObj.name : "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const saveAnimalType = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      await makeRequest(
        "PUT",
        globals.admin.animalType.edit,
        {
          id: systemTypeObj.id,
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...מעדכן סוג חיה",
        "סוג החיה עודכן בהצלחה"
      );
    } else {
      await makeRequest(
        "POST",
        globals.admin.animalType.new,
        {
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...יוצר סוג חיה",
        "סוג החיה נוצר בהצלחה"
      );
    }
  };

  return (
    <div className="SaveAnimalType">
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
          {isEdit ? "עריכת סוג חיה" : "הוספת סוג חיה"}
        </h2>
        <form className="save-entity-form" onSubmit={(e) => saveAnimalType(e)}>
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

export default SaveAnimalType;
