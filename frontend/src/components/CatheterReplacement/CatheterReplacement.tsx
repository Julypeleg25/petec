import { FiAlertTriangle } from "react-icons/fi";
import "./CatheterReplacement.css";
import { getFormattedDateFromDBdate } from "../../utils/DateFormattingUtil";

interface CatheterReplacementProps {
  catheterDate: string;
}

function CatheterReplacement({ catheterDate }: CatheterReplacementProps) {
  return (
    <div className="CatheterReplacement">
      <FiAlertTriangle size={60} color="var(--color-main)" />
      <div className="catheter-replacement-text">
        <div>דרושה החלפת קטטר</div>
        {getFormattedDateFromDBdate(catheterDate)} :תאריך הכנסת קטטר אחרון
        <div></div>
      </div>
    </div>
  );
}

export default CatheterReplacement;
