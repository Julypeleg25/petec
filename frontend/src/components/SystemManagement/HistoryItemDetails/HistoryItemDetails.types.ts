export interface HistoryItem {
    subject: string;
    description: string;
    created_at: string;
    created_by_name: string;
    case_id?: string;
    patient_name?: string;
}

export interface IProps {
    historyObj: HistoryItem;
    setShowHistoryDetails: (show: boolean) => void;
}
