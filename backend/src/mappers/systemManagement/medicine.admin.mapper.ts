import type { AdminMedicineRowDTO } from "@petec/shared";
import {
  toBooleanWithDefault,
  toMapperIdString,
  toNullableFiniteNumber,
  toNullableIsoDateString,
  toNullableTrimmedString,
  type MapperReferenceId,
} from "@mappers/common/common.mappers.utils";
import {
  MEDICINE_ADMIN_MAPPER_OBJECT_KEYS,
} from "./medicine.admin.mapper.constants";

type NamedLookupRef = {
  _id?: MapperReferenceId;
  name?: string | null;
};

type LookupRef = MapperReferenceId | NamedLookupRef | null | undefined;

type MedicineAdminDoc = {
  _id?: MapperReferenceId;
  serialId?: string | null;
  name?: string | null;
  categoryId?: LookupRef;
  measureUnitTypeId?: LookupRef;
  dosageFrequencyId?: LookupRef;
  routeOfAdministrationId?: LookupRef;
  rangeMin?: number | null;
  rangeMax?: number | null;
  totalDose?: number | null;
  comments?: string | null;
  isDeleted?: boolean | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

const isNamedLookupRef = (value: LookupRef): value is NamedLookupRef =>
  typeof value === "object" &&
  value !== null &&
  MEDICINE_ADMIN_MAPPER_OBJECT_KEYS.NAME in value;

const toNullableId = (value: LookupRef): string | null => {
  if (value == null) {
    return null;
  }

  const mapperValue: MapperReferenceId =
    typeof value === "object" &&
      value !== null &&
      MEDICINE_ADMIN_MAPPER_OBJECT_KEYS.ID in value &&
      value._id != null
      ? value._id
      : (value as MapperReferenceId);

  const id = toMapperIdString(mapperValue);
  return id.length > 0 ? id : null;
};

const toNullableLookupName = (value: LookupRef): string | null => {
  if (!isNamedLookupRef(value)) {
    return null;
  }
  return toNullableTrimmedString(value.name);
};

export const toAdminMedicineRowDTO = (
  doc: MedicineAdminDoc,
): AdminMedicineRowDTO => {
  const id = toNullableId(doc._id);
  if (!id) {
    throw new Error("Medicine row is missing _id");
  }

  const isDeleted = toBooleanWithDefault(doc.isDeleted, false);

  return {
    id,
    serial_id: toNullableTrimmedString(doc.serialId),
    name: toNullableTrimmedString(doc.name),

    category_id: toNullableId(doc.categoryId),
    medicine_category: toNullableLookupName(doc.categoryId),

    measure_unit_id: toNullableId(doc.measureUnitTypeId),
    measure_unit: toNullableLookupName(doc.measureUnitTypeId),

    dosage_frequency_id: toNullableId(doc.dosageFrequencyId),
    dosage_frequency: toNullableLookupName(doc.dosageFrequencyId),

    route_of_administration_id: toNullableId(doc.routeOfAdministrationId),
    route_of_administration: toNullableLookupName(doc.routeOfAdministrationId),

    range_min: toNullableFiniteNumber(doc.rangeMin),
    range_max: toNullableFiniteNumber(doc.rangeMax),
    total_dose: toNullableFiniteNumber(doc.totalDose),
    comments: toNullableTrimmedString(doc.comments),

    is_deleted: isDeleted,

    created_at: toNullableIsoDateString(doc.createdAt) ?? new Date().toISOString(),
    updated_at: toNullableIsoDateString(doc.updatedAt),
  };
};
