export interface PopulatedRefDoc {
  _id: { toString(): string } | string;
  name?: string;
}

export interface MedicineLeanDoc {
  _id: string | { toString(): string };
  name?: string;
  isActive?: boolean;
  legacyId?: number;
  measureUnitId?: PopulatedRefDoc | null;
  rangeMax?: number | null;
  rangeMin?: number | null;
  totalDose?: number | null;
  comments?: string | null;
  routeOfAdministrationId?: PopulatedRefDoc | null;
  dosageFrequencyId?: PopulatedRefDoc | null;
  categoryId?: PopulatedRefDoc | null;
  defaultUnit?: string | null;
}

export interface SimpleTypeLeanDoc {
  _id: string | { toString(): string };
  name?: string;
  isActive?: boolean;
  legacyId?: number;
}
