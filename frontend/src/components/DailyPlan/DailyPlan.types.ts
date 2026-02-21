export interface DailyPlanFormData {
    [caseId: string]: { caseId: string; comments: string };
}

export interface ExaminationItem {
    name: string;
    value: string;
    date: string;
}

export interface ProcedureItem {
    name: string;
    value: boolean;
    date: string;
}

export interface OwnerUpdateItem {
    value: string;
    date: string;
}

export interface ReleaseMedicineItem {
    value: boolean;
    date: string;
}
