import { API_ROUTES } from "../../config/apiRoutes";
import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { SystemTypes, type SystemTypeConfig } from "./SystemTypesData.types";
import {
  ANIMAL_VITALS_COLUMNS,
  MEDICINE_COLUMNS,
  RACE_COLUMNS,
} from "./SystemTypesData.columns";
import { TABLE_SORT_DIRECTIONS } from "../../utils/TableGenerator/TableGenerator.types";
import {
  createSimpleSystemTypeConfig,
  createSystemTypeConfig,
} from "./SystemTypesData.factories";

export { SystemTypes } from "./SystemTypesData.types";
export type { SystemTypeConfig } from "./SystemTypesData.types";

export const systemTypesData = {
  medicines: createSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.MEDICINES,
    query: SYSTEM_TYPE_NAMES.MEDICINES,
    columnsData: MEDICINE_COLUMNS,
    orderBy: { name: TABLE_SORT_DIRECTIONS.ASC },
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את התרופה",
    deleteUrl: API_ROUTES.admin.medicine.base,
    systemType: SystemTypes.MEDICINE,
  }),
  animalColors: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.ANIMAL_COLORS,
    query: SYSTEM_TYPE_NAMES.ANIMAL_COLORS,
    nameColumnLabel: "צבע חיה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את צבע החיה",
    deleteUrl: API_ROUTES.admin.animalColor.base,
    systemType: SystemTypes.ANIMAL_COLOR,
  }),
  animalTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
    query: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
    nameColumnLabel: "סוג חיה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג החיה",
    deleteUrl: API_ROUTES.admin.animalType.base,
    systemType: SystemTypes.ANIMAL_TYPE,
  }),
  animalVitals: createSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
    query: SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
    columnsData: ANIMAL_VITALS_COLUMNS,
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג ההתראה",
    deleteUrl: API_ROUTES.admin.animalVitals.base,
    systemType: SystemTypes.ANIMAL_VITALS,
  }),
  fecesTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.FECES_TYPES,
    query: SYSTEM_TYPE_NAMES.FECES_TYPES,
    nameColumnLabel: "סוג צואה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הצואה",
    deleteUrl: API_ROUTES.admin.fecesType.base,
    systemType: SystemTypes.FECES_TYPE,
  }),
  urineTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.URINE_TYPES,
    query: SYSTEM_TYPE_NAMES.URINE_TYPES,
    nameColumnLabel: "סוג שתן",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג השתן",
    deleteUrl: API_ROUTES.admin.urineType.base,
    systemType: SystemTypes.URINE_TYPE,
  }),
  foodTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.FOOD_TYPES,
    query: SYSTEM_TYPE_NAMES.FOOD_TYPES,
    nameColumnLabel: "סוג אוכל",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג האוכל",
    deleteUrl: API_ROUTES.admin.foodType.base,
    systemType: SystemTypes.FOOD_TYPE,
  }),
  genderTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.GENDER_TYPES,
    query: SYSTEM_TYPE_NAMES.GENDER_TYPES,
    nameColumnLabel: "מין חיה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את מין החיה",
    deleteUrl: API_ROUTES.admin.genderType.base,
    systemType: SystemTypes.GENDER_TYPE,
  }),
  raceTypes: createSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.RACE_TYPES,
    query: SYSTEM_TYPE_NAMES.RACE_TYPES,
    columnsData: RACE_COLUMNS,
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את גזע החיה",
    deleteUrl: API_ROUTES.admin.raceType.base,
    systemType: SystemTypes.RACE_TYPE,
  }),
  measureUnitTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES,
    query: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES,
    nameColumnLabel: "שם מידה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את המידה",
    deleteUrl: API_ROUTES.admin.measureUnitType.base,
    systemType: SystemTypes.MEASURE_UNIT_TYPE,
  }),
  dosageFrequencyTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES,
    query: SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את התדירות",
    deleteUrl: API_ROUTES.admin.dosageFrequencyType.base,
    systemType: SystemTypes.DOSAGE_FREQUENCY_TYPE,
  }),
  insuranceTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.INSURANCE_TYPES,
    query: SYSTEM_TYPE_NAMES.INSURANCE_TYPES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הביטוח",
    deleteUrl: API_ROUTES.admin.insuranceType.base,
    systemType: SystemTypes.INSURANCE_TYPE,
  }),
  foodExtrasTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES,
    query: SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג תוספות האוכל",
    deleteUrl: API_ROUTES.admin.foodExtrasType.base,
    systemType: SystemTypes.FOOD_EXTRAS_TYPE,
  }),
  procedureTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.PROCEDURE_TYPES,
    query: SYSTEM_TYPE_NAMES.PROCEDURE_TYPES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הפרוצדורה",
    deleteUrl: API_ROUTES.admin.proceduresTypes.base,
    systemType: SystemTypes.PROCEDURE_TYPE,
  }),
  examinationTypes: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.EXAMINATION_TYPES,
    query: SYSTEM_TYPE_NAMES.EXAMINATION_TYPES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הבדיקה",
    deleteUrl: API_ROUTES.admin.examinationType.base,
    systemType: SystemTypes.EXAMINATION_TYPE,
  }),
  routeOfAdministration: createSimpleSystemTypeConfig({
    typeName: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    query: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את אופן המתן",
    deleteUrl: API_ROUTES.admin.routeOfAdministration.base,
    systemType: SystemTypes.ROUTE_OF_ADMINISTRATION,
  }),
} satisfies Record<string, SystemTypeConfig>;
