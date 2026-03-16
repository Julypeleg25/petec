import type { MedicineCategoryType } from "@petec/shared";

export const medicineKeys = {
  all: ["medicines"] as const,
  list: () => ["medicines", "list"] as const,
  byCategory: (categoryType: MedicineCategoryType) =>
    ["medicines", "byCategory", categoryType] as const,
  categories: () => ["medicines", "categories"] as const,
  frequencies: () => ["medicines", "frequencies"] as const,
  routesOfAdministration: () => ["medicines", "routesOfAdministration"] as const,
  measureUnitTypes: () => ["medicines", "measureUnitTypes"] as const,
};
