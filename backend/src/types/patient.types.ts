import type { Types } from "mongoose";
import type { IAnesthesiaForm } from "@models/AnesthesiaForm";
import type { ICase } from "@models/Case";
import type { IPatient } from "@models/Patient";
import type { IPatientMedicine } from "@models/PatientMedicine";
import type { ChartsDataResponseDTO } from "@petec/shared";
import type { MapperReferenceId, MapperIdValue } from "@mappers/common/common.mappers.utils";

export interface PopulatedNameRef {
  _id: MapperIdValue;
  name?: string;
}

export type CaseRefsReference = {
  [K in keyof ICase["refs"]]?: MapperReferenceId;
};

export type PopulatedPatient = Partial<Pick<IPatient, "name" | "photoName" | "owner" | "updatedAt">> & {
  _id: MapperIdValue;
  refs?: CaseRefsReference;
};

type PopulatedOrIdReference = Types.ObjectId | PopulatedNameRef | string;

export type CaseWithPopulatedPatient = Omit<ICase, "patientId" | "refs"> & {
  patientId?: Types.ObjectId | PopulatedPatient | string;
  refs?: CaseRefsReference;
};

export type MedWithPopulatedName = Omit<
  IPatientMedicine,
  "medicineId" | "measureUnitTypeId" | "dosageFrequencyId" | "routeOfAdministrationId"
> & {
  medicineId?: PopulatedOrIdReference;
  measureUnitTypeId?: PopulatedOrIdReference;
  dosageFrequencyId?: PopulatedOrIdReference;
  routeOfAdministrationId?: PopulatedOrIdReference;
};

export type MasterCasePopulatedPatient = Pick<PopulatedPatient, "_id" | "name" | "photoName" | "updatedAt">;
export type DailyPlanPopulatedPatient = Pick<PopulatedPatient, "name" | "owner">;
export type ChartDataPoint = NonNullable<ChartsDataResponseDTO["temperature"][number]>;

export type AnesthesiaFormUpsertData = Partial<IAnesthesiaForm> & {
  updatedByUserId: Types.ObjectId;
};
