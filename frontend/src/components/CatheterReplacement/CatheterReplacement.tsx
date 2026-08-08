import { FiAlertTriangle } from "react-icons/fi";
import "./CatheterReplacement.css";
import { getFormattedDateFromDBdate } from "../../utils/DateFormattingUtil";

interface CatheterReplacementProps {
  catheterDate: Date | string;
}

function CatheterReplacement({ catheterDate }: CatheterReplacementProps) {
  return (
    <div className="CatheterReplacement">
      <FiAlertTriangle size={60} color="var(--color-main)" />
      <div className="catheter-replacement-text" dir="rtl">
        <div>דרושה החלפת קטטר</div>
        <div>
          תאריך הכנסת קטטר אחרון: {getFormattedDateFromDBdate(catheterDate)}
        </div>
      </div>
    </div>
  );
}

export default CatheterReplacement;
