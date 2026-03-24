import { useState } from "react";
import { ISaveSystemProps } from "../SystemManagement";
import "./SaveRouteOfAdministration.css";
import { makeRequest } from "../../../utils/AxiosInterceptors";
import { globals } from "../../../utils/Globals";
import FormInput from "../../../utils/FormInput/FormInput";
import { FaArrowRight } from "react-icons/fa";

interface RouteOfAdministrationData {
  name: string;
  description: string;
}

function SaveRouteOfAdministration({
  systemTypeObj,
  setShowSaveSystemType,
}: ISaveSystemProps) {
  const isEdit = systemTypeObj !== undefined;

  const [formData, setFormData] = useState<RouteOfAdministrationData>({
    name: isEdit ? systemTypeObj.name : "",
    description: isEdit ? systemTypeObj.description : "",
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
        globals.admin.routeOfAdministration.edit,
        {
          id: systemTypeObj.id,
          name: formData.name,
          description: formData.description,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...מעדכן אופן מתן",
        "אופן מתן עודכן בהצלחה"
      );
    } else {
      await makeRequest(
        "POST",
        globals.admin.routeOfAdministration.new,
        {
          name: formData.name,
          description: formData.description,
        },
        true,
        () => setShowSaveSystemType(false),
        undefined,
        undefined,
        "...יוצר אופן מתן",
        "אופן מתן נוצר בהצלחה"
      );
    }
  };

  return (
    <div className="SaveRouteOfAdministration">
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
          {isEdit ? "עריכת אופן מתן" : "הוספת אופן מתן"}
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
          <FormInput
            labelText=":תיאור"
            name="description"
            placeholder="תיאור"
            isRequired={true}
            state={formData.description}
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

export default SaveRouteOfAdministration;
