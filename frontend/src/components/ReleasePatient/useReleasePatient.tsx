import { useEffect, useState } from "react";
import { MedicineSelectOptionObj } from "../MedicinePicker/MedicinePicker.types";
import { patientsApi } from "../../features/patients/patients.api";
import { medicineApi } from "../../features/medicine/medicine.api";
import { getDateForInputFromDBTimeStamp } from "../../utils/FormattingUtil";
import toast from "react-hot-toast";
import { ReleaseFormData } from "./ReleasePatient.types";
import type { UseReleasePatientProps } from "./useReleasePatient.types";

export const useReleasePatient = ({
  caseId,
  isReleased,
  setIsReleased,
  setShowReleasePatientModal,
}: UseReleasePatientProps) => {
  const [medicineList, setMedicineList] = useState<MedicineSelectOptionObj[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<MedicineSelectOptionObj[]>([]);
  const [formData, setFormData] = useState<ReleaseFormData>({
    caseId: caseId,
    stitchesRemovalDate: null,
    nextInspectionDate: null,
    medicines: selectedMedicines,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const getMedicines = async () => {
    try {
      const data = await medicineApi.getAll();
      setMedicineList(
        data.map((medicine) => ({
          value: medicine.id as string,
          text: medicine.name,
          measureUnitId: medicine.measureUnitId ? (medicine.measureUnitId as { _id: string; name: string })._id : "",
          measureUnitText: medicine.measureUnitId
            ? (medicine.measureUnitId as { _id: string; name: string }).name
            : medicine.defaultUnit || "",
          rangeMax: medicine.rangeMax ?? 0,
          rangeMin: medicine.rangeMin ?? 0,
          totalDose: medicine.totalDose ?? 0,
          comments: medicine.comments ?? "",
          defaultMedicineRouteId: medicine.routeOfAdministrationId
            ? (medicine.routeOfAdministrationId as { _id: string; name: string })._id
            : "",
          defaultFrequencyId: medicine.dosageFrequencyId ? (medicine.dosageFrequencyId as { _id: string; name: string })._id : "",
          frequencyId: medicine.dosageFrequencyId ? (medicine.dosageFrequencyId as { _id: string; name: string })._id : "",
          frequencyText: "",
          doseAmount: 0,
          medicineRouteId: medicine.routeOfAdministrationId
            ? (medicine.routeOfAdministrationId as { _id: string; name: string })._id
            : "",
          medicineRouteText: "",
        }))
      );
    } catch {
      /* handled by interceptor */
    }
  };

  const getReleasePatientData = async () => {
    try {
      const data = await patientsApi.getReleasePatientData(caseId);
      setFormData((prev) => ({
        ...prev,
        releaseDate: getDateForInputFromDBTimeStamp(data.releaseDate ?? null),
        stitchesRemovalDate: getDateForInputFromDBTimeStamp(data.stitchesRemovalDate ?? null),
        nextInspectionDate: getDateForInputFromDBTimeStamp(data.nextInspectionDate ?? null),
      }));
      
      const mappedSelectedMedicines: MedicineSelectOptionObj[] = data.medicines.map((med) => ({
        value: med.value,
        text: med.text,
        measureUnitId: med.measureUnitId as string,
        measureUnitText: med.measureUnitText,
        frequencyId: med.frequencyId as string,
        frequencyText: med.frequencyText,
        doseAmount: med.doseAmount,
        medicineRouteId: med.medicineRouteId as string,
        medicineRouteText: med.medicineRouteText,
        rangeMax: med.rangeMax,
        rangeMin: med.rangeMin,
        totalDose: med.totalDose,
        comments: med.comments,
        defaultMedicineRouteId: med.defaultMedicineRouteId as string | null,
        defaultFrequencyId: med.defaultFrequencyId as string | null,
      }));
      
      setSelectedMedicines(mappedSelectedMedicines);
      setLoading(false);
    } catch {
      /* handled by interceptor */
      setLoading(false);
    }
  };

  useEffect(() => {
    getMedicines();
    if (isReleased) getReleasePatientData();
    else setLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const releasePatient = async (e: React.FormEvent) => {
    e.preventDefault();

    const medicines = selectedMedicines.map((med) => ({
      medicineId: String(med.value),
      measureUnitTypeId: med.measureUnitId ? String(med.measureUnitId) : undefined,
      dosageFrequencyId: med.frequencyId ? String(med.frequencyId) : undefined,
      routeOfAdministrationId: med.medicineRouteId ? String(med.medicineRouteId) : undefined,
      doseAmount: med.doseAmount,
      notes: med.comments ? String(med.comments) : undefined,
    }));

    try {
      await patientsApi.releasePatient({
        caseId: formData.caseId,
        stitchesRemovalDate: formData.stitchesRemovalDate
          ? new Date(formData.stitchesRemovalDate)
          : undefined,
        nextInspectionDate: formData.nextInspectionDate
          ? new Date(formData.nextInspectionDate)
          : undefined,
        medicines: medicines,
      });
      toast.success("המטופל שוחרר בהצלחה");
      setShowReleasePatientModal(false);
      setIsReleased(true);
    } catch {
      toast.error("שגיאה בשחרור המטופל");
    }
  };

  return {
    loading,
    formData,
    handleInputChange,
    releasePatient,
    medicineList,
    selectedMedicines,
    setSelectedMedicines,
  };
};
