import { useEffect, useState } from "react";
import { ISaveSystemProps } from "../SystemManagement.types";
import "./SaveMedicine.css";
import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";
import FormSelect from "../../../utils/FormSelect/FormSelect";
import { SelectOptionObj } from "../../../utils/FormSelect/FormSelect.types";
import { systemTypesApi } from "../../../features/system-management/system-types.api";
import { medicineApi } from "../../../features/medicine/medicine.api";
import FormTextarea from "../../../utils/FormTextarea/FormTextarea";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateMedicineDTO } from "@petec/shared";

import { MedicineFormData } from "./SaveMedicine.types";
function SaveMedicine({
  systemTypeObj,
  setShowSaveSystemType,
}: ISaveSystemProps) {
  const isEdit = systemTypeObj !== undefined && systemTypeObj !== null;

  const [formData, setFormData] = useState<MedicineFormData>({
    name: isEdit ? (systemTypeObj?.name as string) : "",
    rangeMax: isEdit ? (systemTypeObj?.range_max as number) : null,
    rangeMin: isEdit ? (systemTypeObj?.range_min as number) : null,
    totalDose: isEdit ? (systemTypeObj?.total_dose as number) : null,
    comments: isEdit ? (systemTypeObj?.comments as string) : null,
  });
  const queryClient = useQueryClient();

  const mapToSelectOptions = (
    items: { id: string; name: string }[] | undefined,
  ): SelectOptionObj[] =>
    items ? items.map((item) => ({ value: item.id, text: item.name })) : [];

  const { data: categories = [] } = useQuery({
    queryKey: ["medicineCategories"],
    queryFn: medicineApi.getAllCategoryTypes,
  });
  const { data: units = [] } = useQuery({
    queryKey: ["measureUnits"],
    queryFn: medicineApi.getMeasureUnitTypes,
  });
  const { data: routes = [] } = useQuery({
    queryKey: ["routesOfAdministration"],
    queryFn: medicineApi.getRoutesOfAdministration,
  });
  const { data: frequencies = [] } = useQuery({
    queryKey: ["dosageFrequencies"],
    queryFn: medicineApi.getFrequencies,
  });

  const medicineCategoryTypes = mapToSelectOptions(categories);
  const measureUnitTypes = mapToSelectOptions(units);
  const routesOfAdministrationTypes = mapToSelectOptions(routes);
  const dosageFrequenciesTypes = mapToSelectOptions(frequencies);
  const [
    selectedRoutesOfAdministrationType,
    setSelectedRoutesOfAdministrationType,
  ] = useState<string>(
    isEdit ? ((systemTypeObj?.route_of_administration_id as string) ?? "") : "",
  );
  const [selectedDosageFrequenciesType, setSelectedDosageFrequenciesType] =
    useState<string>(
      isEdit ? ((systemTypeObj?.dosage_frequency_id as string) ?? "") : "",
    );
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>(
    isEdit ? ((systemTypeObj?.category_id as string) ?? "") : "",
  );
  const [selectedMeasureUnitType, setSelectedMeasureUnitType] =
    useState<string>(
      isEdit ? ((systemTypeObj?.measure_unit_id as string) ?? "") : "",
    );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getCleanValue = (
    val: string | number | null | undefined,
  ): string | number | null => {
    if (val === "" || val === undefined || val === null) return null;
    return val;
  };

  const saveMutation = useMutation({
    mutationFn: async (body: CreateMedicineDTO) => {
      if (isEdit) {
        const id = String(systemTypeObj?._id || systemTypeObj?.id);
        await systemTypesApi.update("medicines", id, body);
      } else {
        await systemTypesApi.create("medicines", body);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "התרופה עודכנה בהצלחה" : "התרופה נוצרה בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["systemType"] });
      setShowSaveSystemType(false);
    },
    onError: () => {
      toast.error("שגיאה בשמירת התרופה");
    },
  });

  const saveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      name: formData.name,
      rangeMax: getCleanValue(formData.rangeMax),
      rangeMin: getCleanValue(formData.rangeMin),
      totalDose: getCleanValue(formData.totalDose),
      routeOfAdministrationId: getCleanValue(
        selectedRoutesOfAdministrationType,
      ) as string | null,
      dosageFrequencyId: getCleanValue(selectedDosageFrequenciesType) as
        | string
        | null,
      measureUnitId: selectedMeasureUnitType,
      categoryId: selectedCategoryType,
      comments: formData.comments,
      isActive: true,
    };

    saveMutation.mutate(body);
  };

  return (
    <div className="SaveMedicine">
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
          {isEdit ? "עריכת תרופה" : "הוספת תרופה"}
        </h2>
        <form className="save-entity-form" onSubmit={(e) => saveMedicine(e)}>
          <FormInput
            labelText=":שם"
            name="name"
            isRequired={true}
            state={formData.name}
            setState={handleInputChange}
            minLength={1}
          />
          <FormInput
            labelText=":טווח - מקסימום"
            name="rangeMax"
            state={formData.rangeMax}
            setState={handleInputChange}
            min={0}
            type="number"
          />
          <FormInput
            labelText=":טווח - מינימום"
            name="rangeMin"
            state={formData.rangeMin}
            setState={handleInputChange}
            min={0}
            type="number"
          />
          <FormInput
            labelText=":מינון כולל"
            name="totalDose"
            state={formData.totalDose}
            setState={handleInputChange}
            min={0}
            type="number"
          />
          <FormSelect
            labelText=":מידה"
            elements={measureUnitTypes}
            optionState={selectedMeasureUnitType}
            setOptionState={setSelectedMeasureUnitType}
            isRequired={true}
            selectId="save-medicine-select-unit-type"
          />
          <FormSelect
            labelText=":קטגוריה"
            elements={medicineCategoryTypes}
            optionState={selectedCategoryType}
            setOptionState={setSelectedCategoryType}
            isRequired={true}
            selectId="save-medicine-select-medicine-category-type"
          />
          <FormSelect
            labelText=":תדירות"
            elements={dosageFrequenciesTypes}
            optionState={selectedDosageFrequenciesType}
            setOptionState={setSelectedDosageFrequenciesType}
            selectId="save-medicine-select-dosage-frequency-type"
          />
          <FormSelect
            labelText=":אופן מתן"
            elements={routesOfAdministrationTypes}
            optionState={selectedRoutesOfAdministrationType}
            setOptionState={setSelectedRoutesOfAdministrationType}
            selectId="save-medicine-select-routes-of-administration-type"
          />
          <FormTextarea
            labelText=":הערות"
            name="comments"
            state={formData.comments}
            setState={handleInputChange}
            height={"70px"}
            maxLength={300}
          />
          <button type="submit" className="btn btn-large save-entity-form-btn">
            שמור
          </button>
        </form>
      </div>
    </div>
  );
}

export default SaveMedicine;
