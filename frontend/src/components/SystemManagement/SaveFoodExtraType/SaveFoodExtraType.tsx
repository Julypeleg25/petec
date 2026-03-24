import { useState } from "react";
import { ISaveSystemProps } from "../SystemManagement";
import "./SaveFoodExtraType.css"
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";

interface FoodExtrasTypeData {
    name: string;
  }

function SaveFoodExtraType({
    systemTypeObj,
    setShowSaveSystemType,
  }: ISaveSystemProps) {
    const isEdit = systemTypeObj !== undefined;
  
    const [formData, setFormData] = useState<FoodExtrasTypeData>({
      name: isEdit ? systemTypeObj.name : "",
    });
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };
  
    const saveFoodExtraType = async (e: React.FormEvent) => {
      e.preventDefault();
  
      if (isEdit) {
        await makeRequest(
          "PUT",
          globals.admin.foodExtrasType.edit,
          {
            id: systemTypeObj.id,
            name: formData.name,
          },
          true,
          () => setShowSaveSystemType(false),
          undefined,
          undefined,
          "...מעדכן סוג תוספות לאוכל",
          "סוג תוספות לאוכל עודכן בהצלחה"
        );
      } else {
        await makeRequest(
          "POST",
          globals.admin.foodExtrasType.new,
          {
            name: formData.name,
          },
          true,
          () => setShowSaveSystemType(false),
          undefined,
          undefined,
          "...יוצר סוג תוספות לאוכל",
          "סוג תוספות לאוכל נוצר בהצלחה"
        );
      }
    };
  
    return (
      <div className="SaveFoodExtraType">
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
            {isEdit ? "עריכת סוג תוספות לאוכל" : "הוספת סוג תוספות לאוכל"}
          </h2>
          <form className="save-entity-form" onSubmit={(e) => saveFoodExtraType(e)}>
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

export default SaveFoodExtraType
