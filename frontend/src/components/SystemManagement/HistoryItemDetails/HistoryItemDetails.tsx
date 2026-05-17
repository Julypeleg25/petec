import { FaArrowRight } from "react-icons/fa";
import FormInput from "../../../utils/FormInput/FormInput";
import "./HistoryItemDetails.css";
import FormTextarea from "../../../utils/FormTextarea/FormTextarea";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator.types";

export interface HistoryItem extends RowData {
  subject: string;
  description: string;
  created_at: string;
  created_by_name: string;
  case_id?: string;
  case_serial_id?: string;
  patient_name?: string;
}

interface HistoryItemDetailsProps {
  historyObj: HistoryItem;
  setShowHistoryDetails: (show: boolean) => void;
}

function HistoryItemDetails({
  historyObj,
  setShowHistoryDetails,
}: HistoryItemDetailsProps) {
  return (
    <div className="HistoryItemDetails">
      <button
        className="btn btn-active btn-round back-btn"
        onClick={() => {
          setShowHistoryDetails(false);
        }}
      >
        <FaArrowRight />
      </button>
      <div className="history-form-container">
        <h2 className="history-form-title">פרטים</h2>
        <form className="history-form">
          <FormInput
            labelText=":נושא"
            state={historyObj.subject}
            disabled={true}
          />
          <FormTextarea
            labelText=":תיאור"
            state={historyObj.description}
            height={"100px"}
            readOnly={true}
          />
          <FormInput
            labelText=":תאריך"
            state={historyObj.created_at}
            disabled={true}
          />
          <FormInput
            labelText=":משתמש"
            state={historyObj.created_by_name}
            disabled={true}
          />
          <FormInput
            labelText=":מספר תיק"
            state={historyObj.case_serial_id}
            disabled={true}
          />
          <FormInput
            labelText=":שם מטופל"
            state={historyObj.patient_name}
            disabled={true}
          />
        </form>
      </div>
    </div>
  );
}

export default HistoryItemDetails;
