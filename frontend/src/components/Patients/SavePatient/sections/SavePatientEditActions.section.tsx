import { FaArrowRight } from "react-icons/fa";
import { Button } from "../../../../utils/Button/Button";
import SavePatientActionsMenu, {
  type SavePatientActions,
} from "./SavePatientActionsMenu";

interface SavePatientEditActionsSectionProps {
  readonly actions: SavePatientActions;
}

function SavePatientEditActionsSection({
  actions,
}: SavePatientEditActionsSectionProps) {
  return (
    <div className="edit-patient-actions-container">
      <div className="edit-patient-actions-desktop edit-patient-actions-menu-bar">
        <SavePatientActionsMenu
          actions={actions}
          menuId="edit-patient-actions-menu-panel"
          variant="desktop"
        />
        <Button
          type="button"
          active
          round
          className="edit-patient-back-btn"
          onClick={actions.onBack}
          aria-label="חזרה"
        >
          <FaArrowRight />
        </Button>
      </div>
    </div>
  );
}

export default SavePatientEditActionsSection;
