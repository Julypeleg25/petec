import { SYSTEM_TYPE_NAMES, type SystemTypeName } from "@petec/shared";

export const CASE_SEARCH_RESULT_LIMIT = 1000;



export const CASE_TEXT_FILTER_KEYS = {
    SERIAL_ID: "serialId",
    PATIENT_NAME: "patientId.name",
    OWNER_PHONE: "patientId.owner.phone",
} as const;

export const USER_FILTER_KEY_MAP: Record<string, string> = {
    first_name: "firstName",
    last_name: "lastName",
    role_name: "role",
};



export const SYSTEM_TYPE_FIELD_MAP: Record<string, string> = {
    id: "_id",
    _id: "_id",
    name: "name",
    serial_id: "serialId",
    is_deleted: "isDeleted",
    created_at: "createdAt",
    updated_at: "updatedAt",
    animal_type_id: "animalTypeId",
    animal_type: "animalTypeId",
    category_id: "categoryId",
    medicine_category: "categoryId",
    measure_unit_id: "measureUnitTypeId",
    measure_unit: "measureUnitTypeId",
    dosage_frequency_id: "dosageFrequencyId",
    dosage_frequency: "dosageFrequencyId",
    route_of_administration_id: "routeOfAdministrationId",
    route_of_administration: "routeOfAdministrationId",
    range_min: "rangeMin",
    range_max: "rangeMax",
    total_dose: "totalDose",
    comments: "comments",
    vitals_type: "vitalsType",
};

export const SYSTEM_TYPE_REFERENCE_FILTER_TARGETS: Record<
    string,
    SystemTypeName
> = {
    animal_type: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
    medicine_category: SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES,
    measure_unit: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES,
    dosage_frequency: SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES,
    route_of_administration: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
};

export const SYSTEM_TYPE_NUMERIC_FIELDS = new Set<string>([
    "rangeMin",
    "rangeMax",
    "totalDose",
    "minValue",
    "maxValue",
]);
