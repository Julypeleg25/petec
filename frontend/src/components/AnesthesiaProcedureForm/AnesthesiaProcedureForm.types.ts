import type { AnesthesiaProcedureFormDTO } from "@petec/shared";

export interface AnesthesiaProcedureFormProps {
    caseId: string;
    caseSerialId: string;
}

export type AnesthesiaBooleanFields =
    | "isFastSinceMidnight"
    | "isDistortionHistory"
    | "isMedicationsSensitive"
    | "isNeedToMarkEar"
    | "isSterilization";

export type AnesthesiaProcedureFormValues = Omit<
    AnesthesiaProcedureFormDTO,
    AnesthesiaBooleanFields
> & {
    isFastSinceMidnight?: boolean | null;
    isDistortionHistory?: boolean | null;
    isMedicationsSensitive?: boolean | null;
    isNeedToMarkEar?: boolean | null;
    isSterilization?: boolean | null;
};
