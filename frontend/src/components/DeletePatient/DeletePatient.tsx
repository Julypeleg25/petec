import "./DeletePatient.css";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../utils/Button/Button";
import { patientsApi } from "../../features/patients/patients.api";
import { patientKeys } from "../../features/patients/hooks/patient.keys";
import { tableKeys } from "../../features/table/hooks/table.keys";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppRoutes } from "../../config/appRoutes";

interface DeletePatientProps {
  caseId: string;
  beforeNavigation?: () => void;
  setShowDeletePatientCaseModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function DeletePatient({
  caseId,
  beforeNavigation,
  setShowDeletePatientCaseModal,
}: DeletePatientProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deletePatient = async () => {
    try {
      await patientsApi.deleteCase({ caseId });
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
      queryClient.invalidateQueries({ queryKey: patientKeys.calendarAll });
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      beforeNavigation?.();
      toast.success("המטופל נמחק בהצלחה");
      navigate(AppRoutes.Patients.List, { replace: true });
      setShowDeletePatientCaseModal(false);
    } catch {
      toast.error("שגיאה במחיקת המטופל");
    }
  };

  return (
    <div className="DeletePatient">
      <h2 className="delete-patient-label modal-dialog-title">מחיקת מטופל</h2>
      <div className="delete-patient-details-container">
        ?האם אתה בטוח שאת/ה רוצה למחוק את המטופל
      </div>

      <Button type="submit" appSize="small" onClick={deletePatient}>
        מחק
      </Button>
    </div>
  );
}

export default DeletePatient;
