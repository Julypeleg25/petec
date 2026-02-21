export interface AnesthesiaProcedureFormProps {
    caseId: string;
    masterCaseId: string;
}

export interface AnesthesiaProcedureFormData {
    ownerName: string;
    name: string;
    plannedProcedure: string;
    priceEstimate: number;
    date: string | null;
    generalComments: string | null;
    distortionComments: string | null;
    medicationsSensitiveComments: string | null;
}
