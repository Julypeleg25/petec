import { useState } from "react";
import { ISaveSystemProps } from "../SystemManagement";
import "./SaveFoodType.css";
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";

interface FoodTypeData {
  name: string;
}

function SaveFoodType({
  systemTypeObj,
  setShowSaveSystemType,
}: ISaveSystemProps) {
  const isEdit = systemTypeObj !== undefined;

  const [formData, setFormData] = useState<FoodTypeData>({
    name: isEdit ? systemTypeObj.name : "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const saveFoodType = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit) {
      await makeRequest(
        "PUT",
        globals.admin.foodType.edit,
        {
          id: systemTypeObj.id,
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...מעדכן סוג מזון",
        "סוג המזון עודכן בהצלחה"
      );
    } else {
      await makeRequest(
        "POST",
        globals.admin.foodType.new,
        {
          name: formData.name,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...יוצר סוג מזון",
        "סוג המזון נוצר בהצלחה"
      );
    }
  };

  return (
    <div className="SaveFecesType">
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
          {isEdit ? "עריכת סוג מזון" : "הוספת סוג מזון"}
        </h2>
        <form className="save-entity-form" onSubmit={(e) => saveFoodType(e)}>
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

export default SaveFoodType;
