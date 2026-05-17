export interface PopulatedRefDoc {
  _id: { toString(): string } | string;
  name?: string;
  description?: string | null;
  serialId?: string;
  isDeleted?: boolean;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MedicineLeanDoc {
  _id: string | { toString(): string };
  name: string;
  description?: string;
  isDeleted: boolean;
  serialId?: string;
  measureUnitTypeId?: PopulatedRefDoc | null;
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
  name: string;
  description?: string;
  isDeleted: boolean;
  serialId?: string;
}
