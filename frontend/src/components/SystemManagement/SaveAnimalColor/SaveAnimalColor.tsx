import { FaArrowRight } from "react-icons/fa";
import { ISaveSystemProps } from "../SystemManagement";
import "./SaveAnimalColor.css";
import { useState } from "react";
import FormInput from "../../../utils/FormInput/FormInput";
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";

interface AnimalColorData {
  name: string;
}

function SaveAnimalColor({
  systemTypeObj,
  setShowSaveSystemType,
}: ISaveSystemProps) {
  const isEdit = systemTypeObj !== undefined;

  const [formData, setFormData] = useState<AnimalColorData>({
    name: isEdit ? systemTypeObj.name : "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const saveAnimalColor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      await makeRequest(
        "PUT",
        globals.admin.animalColor.edit,
        {
          id: systemTypeObj.id,
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...מעדכן צבע חיה",
        "צבע החיה עודכן בהצלחה"
      );
    } else {
      await makeRequest(
        "POST",
        globals.admin.animalColor.new,
        {
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...יוצר צבע חיה",
        "צבע החיה נוצר בהצלחה"
      );
    }
  };

  return (
    <div className="SaveAnimalColor">
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
          {isEdit ? "עריכת צבע חיה" : "הוספת צבע חיה"}
        </h2>
        <form className="save-entity-form" onSubmit={(e) => saveAnimalColor(e)}>
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

export default SaveAnimalColor;
