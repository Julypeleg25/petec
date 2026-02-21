import { useState } from "react";
import { ISaveSystemProps } from "../SystemManagement.types";
import "./SaveRaceType.css";
import { apiClient } from "../../../lib/api-client";
import { API_ROUTES } from "../../../config/api-routes";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";
import FormSelect from "../../../utils/FormSelect/FormSelect";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import toast from "react-hot-toast";

import { RaceTypeData } from "./SaveRaceType.types";
function SaveRaceType({
  systemTypeObj,
  setShowSaveSystemType,
}: ISaveSystemProps) {
  const isEdit = systemTypeObj !== undefined;

  const [formData, setFormData] = useState<RaceTypeData>({
    name: isEdit ? ((systemTypeObj?.name as string) ?? "") : "",
  });
  const [selectedAnimalType, setSelectedAnimalType] = useState(
    isEdit ? ((systemTypeObj?.animal_type_id as string) ?? "") : "",
  );

  const queryClient = useQueryClient();

  const {
    data: animalTypesOptions = [{ value: "0", text: "" }],
    isLoading: isLoadingTypes,
  } = useQuery({
    queryKey: ["animalTypes"],
    queryFn: async () => {
      const res = await apiClient.get<
        unknown,
        AxiosResponse<Array<{ id: string; name: string }>>
      >(API_ROUTES.admin.animalType.all);
      return res.data.map((type) => ({
        value: type.id,
        text: type.name,
      }));
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        if (!systemTypeObj?.id) throw new Error("Missing ID");
        await apiClient.put(
          API_ROUTES.admin.raceType.byId(String(systemTypeObj.id)),
          {
            id: systemTypeObj.id,
            name: formData.name,
            animalTypeId: selectedAnimalType,
          },
        );
      } else {
        await apiClient.post(API_ROUTES.admin.raceType.base, {
          name: formData.name,
          animalTypeId: selectedAnimalType,
        });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "גזע החיה עודכן בהצלחה" : "גזע החיה נוצר בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["systemType"] });
      setShowSaveSystemType(false);
    },
    onError: () => {
      toast.error(isEdit ? "שגיאה בעדכון גזע" : "שגיאה ביצירת גזע");
    },
  });

  const saveRaceType = async (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className="SaveRaceType">
      <button
        className="btn btn-active btn-round back-btn"
        onClick={() => {
          setShowSaveSystemType(false);
        }}
      >
        <FaArrowRight />
      </button>
      <div className="save-entity-form-container">
        <h2 className="save-entity-form-title">
          {isEdit ? "עריכת סוג גזע" : "הוספת סוג גזע"}
        </h2>
        <form className="save-entity-form" onSubmit={(e) => saveRaceType(e)}>
          <FormInput
            labelText=":שם"
            name="name"
            placeholder="שם"
            isRequired={true}
            state={formData.name}
            setState={handleInputChange}
            minLength={1}
          />
          <FormSelect
            elements={
              isLoadingTypes
                ? [{ value: "0", text: "טוען..." }]
                : animalTypesOptions
            }
            optionState={selectedAnimalType}
            setOptionState={setSelectedAnimalType}
            isRequired={true}
            selectId="save-race-type-select-animal-type"
          />
          <button type="submit" className="btn btn-large save-entity-form-btn">
            שמור
          </button>
        </form>
      </div>
    </div>
  );
}

export default SaveRaceType;
