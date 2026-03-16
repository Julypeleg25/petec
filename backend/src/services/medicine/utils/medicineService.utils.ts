import { Types } from "mongoose";
import type { MedicineCategoryType } from "@petec/shared";

export type MedicineCategoryLeanDoc = {
  _id: Types.ObjectId | string;
  name?: string | null;
  serialId?: string | null;
  type: MedicineCategoryType;
};

export const MEDICINE_SORT = { name: 1 } as const;
export const MEDICINE_ACTIVE_FILTER = { isDeleted: { $ne: true } } as const;
