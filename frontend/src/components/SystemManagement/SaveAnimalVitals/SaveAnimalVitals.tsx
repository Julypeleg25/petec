import { ISaveSystemProps } from "../SystemManagement.types";
import "./SaveAnimalVitals.css";
import FormSelect from "../../../utils/FormSelect/FormSelect";
import { FaArrowRight } from "react-icons/fa";
import { apiClient, getValForFormData } from "../../../lib/api-client";
import { API_ROUTES } from "../../../config/api-routes";
import FormInput from "../../../utils/FormInput/FormInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import toast from "react-hot-toast";

import { vitalsSchema, FormValues } from "./SaveAnimalVitals.types";

const animalVitalsTypes = [
  { value: "T", text: "טמפרטורה" },
  { value: "P", text: "דופק" },
  { value: "R", text: "נשימה" },
];

function SaveAnimalVitals({
  systemTypeObj,
  setShowSaveSystemType,
}: ISaveSystemProps) {
  const isEdit = systemTypeObj !== undefined;
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      rangeMax: isEdit && systemTypeObj?.maxValue != null ? Number(systemTypeObj.maxValue) : null,
      rangeMin: isEdit && systemTypeObj?.minValue != null ? Number(systemTypeObj.minValue) : null,
      animalId: isEdit ? String(systemTypeObj?.animalTypeId) : "",
      vitalsType: isEdit ? String(systemTypeObj?.name) : "",
    },
  });

  const { data: animalTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["animalTypes"],
    queryFn: async () => {
      const res = await apiClient.get<unknown, AxiosResponse<Array<{ id: string; name: string }>>>(
        API_ROUTES.admin.animalType.all
      );
      return res.data.map((type) => ({
        value: type.id,
        text: type.name,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const body = {
        id: isEdit ? systemTypeObj?.id : undefined,
        maxValue: getValForFormData(data.rangeMax),
        minValue: getValForFormData(data.rangeMin),
        name: data.vitalsType,
        animalTypeId: data.animalId,
      };

      if (isEdit) {
        if (!systemTypeObj?.id) throw new Error("Missing ID for update");
        await apiClient.put(API_ROUTES.admin.animalVitals.byId(String(systemTypeObj.id)), body);
      } else {
        delete body.id;
        await apiClient.post(API_ROUTES.admin.animalVitals.base, body);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "סוג ההתראה עודכנה בהצלחה" : "סוג ההתראה נוצרה בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["animalVitals"] });
      setShowSaveSystemType(false);
    },
    onError: () => {
      // toast is handled globally in queryClient mutations config, but can be added here if needed
    },
  });

  const onSubmit = (data: FormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="SaveAnimalVitals">
      <button
        className="btn btn-active btn-round back-btn"
        onClick={() => setShowSaveSystemType(false)}
      >
        <FaArrowRight />
      </button>
      <div className="save-entity-form-container">
        <h2 className="save-entity-form-title">
          {isEdit ? "עריכת סוג התראה" : "הוספת סוג התראה"}
        </h2>
        <form className="save-entity-form" onSubmit={handleSubmit(onSubmit)}>
          
          <Controller
            name="animalId"
            control={control}
            render={({ field }) => (
              <div style={{ width: "100%" }}>
                <FormSelect
                  labelText=":סוג חיה"
                  elements={isLoadingTypes ? [] : animalTypes}
                  optionState={field.value}
                  setOptionState={field.onChange}
                  isRequired={true}
                  selectId="save-animal-vitals-select-animal-type"
                  disabled={isEdit || isLoadingTypes}
                />
                {errors.animalId && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.animalId.message}</span>}
              </div>
            )}
          />

          <Controller
            name="vitalsType"
            control={control}
            render={({ field }) => (
              <div style={{ width: "100%" }}>
                <FormSelect
                  labelText=":סוג"
                  elements={animalVitalsTypes}
                  optionState={field.value}
                  setOptionState={field.onChange}
                  isRequired={true}
                  selectId="save-animal-vitals-select-animal-vitals-type"
                  disabled={isEdit}
                />
                {errors.vitalsType && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.vitalsType.message}</span>}
              </div>
            )}
          />

          <Controller
            name="rangeMax"
            control={control}
            render={({ field }) => (
              <div style={{ width: "100%" }}>
                <FormInput
                  labelText=":טווח - מקסימום"
                  name={field.name}
                  state={field.value ?? ""}
                  setState={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                  type="number"
                />
                {errors.rangeMax && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.rangeMax.message}</span>}
              </div>
            )}
          />

          <Controller
            name="rangeMin"
            control={control}
            render={({ field }) => (
              <div style={{ width: "100%" }}>
                <FormInput
                  labelText=":טווח - מינימום"
                  name={field.name}
                  state={field.value ?? ""}
                  setState={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                  type="number"
                />
                {errors.rangeMin && <span style={{ color: "red", fontSize: "0.8rem" }}>{errors.rangeMin.message}</span>}
              </div>
            )}
          />

          <button 
            type="submit" 
            className="btn btn-large save-entity-form-btn"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "...שומר" : "שמור"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SaveAnimalVitals;
