import "./SaveMedicine.css";
import FormInput from "../../../utils/FormInput/FormInput";
import FormSelect from "../../../utils/FormSelect/FormSelect";
import { systemTypeKeys, systemTypesApi } from "../../../features/system-management";
import { medicineApi, medicineKeys } from "../../../features/medicine";
import FormTextarea from "../../../utils/FormTextarea/FormTextarea";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { getSharedResolver } from "../../../utils/form";

import {
  SYSTEM_TYPE_NAMES,
  SaveMedicineFormDTOSchema,
  type CreateMedicineDTO,
  type SaveMedicineFormDTO,
} from "@petec/shared";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator.types";

import {
  mapRowToSaveMedicineFormDefaults,
  mapSaveMedicineFormToCreateDto,
} from "./SaveMedicine.utils";
import { getSystemTypeRowId } from "../shared/systemTypeRow.utils";
import { mapSystemTypesToSelectOptions } from "../shared/systemTypeSelect.utils";
import { SystemTypeEditorShell } from "../shared/SystemTypeEditorShell/SystemTypeEditorShell";

interface SaveMedicineProps {
  systemTypeObj: RowData | null;
  onClose: () => void;
}

export default function SaveMedicine({
  systemTypeObj,
  onClose,
}: SaveMedicineProps) {
  const queryClient = useQueryClient();
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SaveMedicineFormDTO>({
    resolver: getSharedResolver(SaveMedicineFormDTOSchema),
    defaultValues: mapRowToSaveMedicineFormDefaults(systemTypeObj),
  });

  const { data: categories = [] } = useQuery({
    queryKey: medicineKeys.categories(),
    queryFn: medicineApi.getAllCategoryTypes,
  });
  const { data: units = [] } = useQuery({
    queryKey: medicineKeys.measureUnitTypes(),
    queryFn: medicineApi.getMeasureUnitTypes,
  });
  const { data: routes = [] } = useQuery({
    queryKey: medicineKeys.routesOfAdministration(),
    queryFn: medicineApi.getRoutesOfAdministration,
  });
  const { data: frequencies = [] } = useQuery({
    queryKey: medicineKeys.frequencies(),
    queryFn: medicineApi.getFrequencies,
  });

  const medicineCategoryTypes = mapSystemTypesToSelectOptions(categories);
  const measureUnitTypes = mapSystemTypesToSelectOptions(units);
  const routesOfAdministrationTypes = mapSystemTypesToSelectOptions(routes);
  const dosageFrequenciesTypes = mapSystemTypesToSelectOptions(frequencies);

  const saveMutation = useMutation({
    mutationFn: async (body: CreateMedicineDTO) => {
      if (systemTypeObj) {
        const id = getSystemTypeRowId(systemTypeObj);
        if (!id) {
          throw new Error("לא ניתן לערוך פריט ללא מזהה");
        }
        await systemTypesApi.update(SYSTEM_TYPE_NAMES.MEDICINES, id, body);
      } else {
        await systemTypesApi.create(SYSTEM_TYPE_NAMES.MEDICINES, body);
      }
    },
    onSuccess: () => {
      toast.success(systemTypeObj ? "התרופה עודכנה בהצלחה" : "התרופה נוצרה בהצלחה");
      queryClient.invalidateQueries({ queryKey: systemTypeKeys.all });
      onClose();
    },
    onError: () => {
      toast.error("שגיאה בשמירת התרופה");
    },
  });

  const saveMedicine = handleSubmit((values) => {
    if (systemTypeObj && !isDirty) {
      toast.error("לא בוצעו שינויים");
      return;
    }

    saveMutation.mutate(mapSaveMedicineFormToCreateDto(values));
  });

  return (
    <SystemTypeEditorShell
      isEdit={!!systemTypeObj}
      createTitle="הוספת תרופה"
      editTitle="עריכת תרופה"
      onClose={onClose}
      onSubmit={saveMedicine}
      isPending={saveMutation.isPending}
      submitDisabled={Boolean(systemTypeObj) && !isDirty}
      editorClassName="SaveMedicine"
      modalClassName="system-management-modal save-medicine-modal"
      overlayClassName="save-user-modal-overlay"
    >
          <div className="form-group">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <FormInput
                  labelText="שם"
                  name={field.name}
                  isRequired={true}
                  state={field.value}
                  setState={(value) => field.onChange(value)}
                  minLength={1}
                />
              )}
            />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div className="form-group">
            <Controller
              name="rangeMax"
              control={control}
              render={({ field }) => (
                <FormInput
                  labelText="טווח - מקסימום"
                  name={field.name}
                  state={field.value !== null ? field.value : ""}
                  setState={(value) => field.onChange(value === "" ? null : Number(value))}
                  min={0}
                  type="number"
                />
              )}
            />
            {errors.rangeMax && <p className="form-error">{errors.rangeMax.message}</p>}
          </div>

          <div className="form-group">
            <Controller
              name="rangeMin"
              control={control}
              render={({ field }) => (
                <FormInput
                  labelText="טווח - מינימום"
                  name={field.name}
                  state={field.value !== null ? field.value : ""}
                  setState={(value) => field.onChange(value === "" ? null : Number(value))}
                  min={0}
                  type="number"
                />
              )}
            />
            {errors.rangeMin && <p className="form-error">{errors.rangeMin.message}</p>}
          </div>

          <div className="form-group">
            <Controller
              name="totalDose"
              control={control}
              render={({ field }) => (
                <FormInput
                  labelText="מינון כולל"
                  name={field.name}
                  state={field.value !== null ? field.value : ""}
                  setState={(value) => field.onChange(value === "" ? null : Number(value))}
                  min={0}
                  type="number"
                />
              )}
            />
            {errors.totalDose && <p className="form-error">{errors.totalDose.message}</p>}
          </div>

          <div className="form-group">
            <Controller
              name="measureUnitTypeId"
              control={control}
              render={({ field }) => (
                <FormSelect
                  labelText="מידה"
                  elements={measureUnitTypes}
                  optionState={field.value}
                  setOptionState={field.onChange}
                  isRequired={true}
                  selectId="save-medicine-select-unit-type"
                />
              )}
            />
            {errors.measureUnitTypeId && <p className="form-error">{errors.measureUnitTypeId.message}</p>}
          </div>

          <div className="form-group">
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <FormSelect
                  labelText="קטגוריה"
                  elements={medicineCategoryTypes}
                  optionState={field.value}
                  setOptionState={field.onChange}
                  isRequired={true}
                  selectId="save-medicine-select-medicine-category-type"
                />
              )}
            />
            {errors.categoryId && <p className="form-error">{errors.categoryId.message}</p>}
          </div>

          <div className="form-group">
            <Controller
              name="dosageFrequencyId"
              control={control}
              render={({ field }) => (
                <FormSelect
                  labelText="תדירות"
                  elements={dosageFrequenciesTypes}
                  optionState={field.value ?? ""}
                  setOptionState={field.onChange}
                  selectId="save-medicine-select-dosage-frequency-type"
                />
              )}
            />
            {errors.dosageFrequencyId && <p className="form-error">{errors.dosageFrequencyId.message}</p>}
          </div>

          <div className="form-group">
            <Controller
              name="routeOfAdministrationId"
              control={control}
              render={({ field }) => (
                <FormSelect
                  labelText="אופן מתן"
                  elements={routesOfAdministrationTypes}
                  optionState={field.value ?? ""}
                  setOptionState={field.onChange}
                  selectId="save-medicine-select-routes-of-administration-type"
                />
              )}
            />
            {errors.routeOfAdministrationId && <p className="form-error">{errors.routeOfAdministrationId.message}</p>}
          </div>

          <div className="form-group SaveMedicine__comments-group">
            <Controller
              name="comments"
              control={control}
              render={({ field }) => (
                <FormTextarea
                  labelText="הערות"
                  name={field.name}
                  state={field.value !== null ? field.value : ""}
                  setState={field.onChange}
                  height={"70px"}
                  maxLength={300}
                />
              )}
            />
            {errors.comments && <p className="form-error">{errors.comments.message}</p>}
          </div>
    </SystemTypeEditorShell>
  );
}
