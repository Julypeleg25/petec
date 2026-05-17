export const MEDICINE_ROUTE_PATHS = {
  all: "/all",
  byCategory: "/getAllByCategoryType/:categoryType",
  categoryTypes: "/getAllCategoryTypes",
  frequencies: "/medicinesFrequencies",
  routesOfAdministration: "/medicinesRoutesForAdministration",
  measureUnits: "/measureUnitTypes",
} as const;
