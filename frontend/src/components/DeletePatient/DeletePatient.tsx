import "./DeletePatient.css";
import { patientsApi } from "../../features/patients/patients.api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppRoutes } from "../../config/appRoutes";

interface DeletePatientProps {
  caseId: string;
  setShowDeletePatientCaseModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function DeletePatient({
  caseId,
  setShowDeletePatientCaseModal,
}: DeletePatientProps) {
  const navigate = useNavigate();

  const deletePatient = async () => {
    try {
      await patientsApi.deleteCase({ caseId });
      toast.success("המטופל נמחק בהצלחה");
      navigate(AppRoutes.Patients.List, { replace: true });
      setShowDeletePatientCaseModal(false);
    } catch {
      toast.error("שגיאה במחיקת המטופל");
    }
  };

  return (
    <div className="DeletePatient">
      <label className="form-label delete-patient-label">מחיקת מטופל</label>
      <div className="delete-patient-details-container">
        ?האם אתה בטוח ברצונך למחוק את המטופל
      </div>

      <button type="submit" className="btn btn-small" onClick={deletePatient}>
        מחק
      </button>
    </div>
  );
}

export default DeletePatient;
