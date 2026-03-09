import type { DailyPlanDetailDTO, UpdateDailyPlanRequestDTO } from "@petec/shared";

export type DailyPlanFormData = UpdateDailyPlanRequestDTO;

export type ExaminationItem = DailyPlanDetailDTO["caseExaminations"][number];
export type ProcedureItem = DailyPlanDetailDTO["caseProcedures"][number];
export type OwnerUpdateItem = DailyPlanDetailDTO["ownerUpdate"][number];
export type ReleaseMedicineItem = DailyPlanDetailDTO["releaseMedicines"][number];
