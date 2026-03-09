import { useCallback, useEffect, useState } from "react";
import { MedicineSelectOptionObj } from "../../MedicinePicker/MedicinePicker.types";
import { patientsApi } from "../../../features/patients/patients.api";
import { medicineApi } from "../../../features/medicine/medicine.api";
import { getDateForInputFromDBTimeStamp } from "../../../utils/DateFormattingUtil";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { ReleaseFormData } from "../ReleasePatient.types";
import {
  ReleasePatientFormDTOSchema,
  type ReleasePatientFormDTO,
} from "@petec/shared";
import { getSharedResolver } from "../../../utils/form";
import { mapMedicineDtoToSelectOption } from "../../../features/medicine/mappers/medicine.mappers";
import {
  isReleaseDateFieldName,
  mapReleaseResponseMedicines,
  mapSelectedMedicinesToReleaseMedicines,
  normalizeReleaseDateInputValue,
} from "./useReleasePatient.utils";

interface UseReleasePatientProps {
  caseId: string;
  caseSerialId: string;
  isReleased: boolean;
  setIsReleased: (val: boolean) => void;
  setShowReleasePatientModal: (val: boolean) => void;
}

export const useReleasePatient = ({
  caseId,
  caseSerialId,
  isReleased,
  setIsReleased,
  setShowReleasePatientModal,
}: UseReleasePatientProps) => {
  const [medicineList, setMedicineList] = useState<MedicineSelectOptionObj[]>(
    [],
  );
  const [selectedMedicines, setSelectedMedicines] = useState<
    MedicineSelectOptionObj[]
  >([]);
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ReleasePatientFormDTO>({
    resolver: getSharedResolver(ReleasePatientFormDTOSchema),
    defaultValues: {
      caseId: caseSerialId,
      stitchesRemovalDate: null,
      nextInspectionDate: null,
    },
  });

  const getMedicines = useCallback(async () => {
    try {
      const data = await medicineApi.getAll();
      setMedicineList(data.map(mapMedicineDtoToSelectOption));
    } catch {
      /* handled by interceptor */
    }
  }, []);

  const getReleasePatientData = useCallback(async () => {
    try {
      const data = await patientsApi.getReleasePatientData(caseId);
      setReleaseDate(getDateForInputFromDBTimeStamp(data.releaseDate ?? null));
      reset({
        caseId: caseSerialId,
        stitchesRemovalDate: getDateForInputFromDBTimeStamp(
          data.stitchesRemovalDate ?? null,
        ),
        nextInspectionDate: getDateForInputFromDBTimeStamp(
          data.nextInspectionDate ?? null,
        ),
      });

      const mappedSelectedMedicines = mapReleaseResponseMedicines(
        data.medicines,
      );

      setSelectedMedicines(mappedSelectedMedicines);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [caseId, caseSerialId, reset]);

  useEffect(() => {
    void getMedicines();
    if (isReleased) {
      void getReleasePatientData();
    } else {
      setLoading(false);
    }
  }, [getMedicines, getReleasePatientData, isReleased]);

  const handleInputChange = (
    value: string | Date | null,
    params?: object | string | number,
  ) => {
    const fieldName = typeof params === "string" ? params : "";
    if (!isReleaseDateFieldName(fieldName)) {
      return;
    }
    if (fieldName === "releaseDate") {
      setReleaseDate(normalizeReleaseDateInputValue(value));
      return;
    }

    setValue(fieldName, normalizeReleaseDateInputValue(value), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const releasePatient = handleSubmit(
    async (values) => {
      const medicines =
        mapSelectedMedicinesToReleaseMedicines(selectedMedicines);

      try {
        await patientsApi.releasePatient({
          caseId: values.caseId,
          stitchesRemovalDate: values.stitchesRemovalDate
            ? new Date(values.stitchesRemovalDate)
            : undefined,
          nextInspectionDate: values.nextInspectionDate
            ? new Date(values.nextInspectionDate)
            : undefined,
          medicines: medicines,
        });
        toast.success("המטופל שוחרר בהצלחה");
        setShowReleasePatientModal(false);
        setIsReleased(true);
      } catch {
        toast.error("שגיאה בשחרור המטופל");
      }
    },
    (formErrors) => {
      const firstError = Object.values(formErrors)[0];
      if (firstError?.message) {
        toast.error(firstError.message.toString());
      }
    },
  );

  const formData: ReleaseFormData = {
    caseId: watch("caseId"),
    releaseDate,
    stitchesRemovalDate: watch("stitchesRemovalDate") ?? null,
    nextInspectionDate: watch("nextInspectionDate") ?? null,
    medicines: selectedMedicines,
  };

  return {
    loading,
    formData,
    control,
    errors,
    handleInputChange,
    releasePatient,
    medicineList,
    selectedMedicines,
    setSelectedMedicines,
  };
};
