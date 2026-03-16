import type { DailyPlanDetailDTO } from "@petec/shared";

export type DailyPlanFormData = Record<string, { comment?: string }>;

export type ExaminationItem = DailyPlanDetailDTO["caseExaminations"][number];
export type ProcedureItem = DailyPlanDetailDTO["caseProcedures"][number];
export type OwnerUpdateItem = DailyPlanDetailDTO["ownerUpdate"][number];
export type ReleaseMedicineItem = DailyPlanDetailDTO["releaseMedicines"][number];
