import { API_ROUTES } from "../../config/apiRoutes";
import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import type { SystemTypeConfig } from "./SystemTypesData.types";
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

export type { SystemTypeConfig } from "./SystemTypesData.types";

export const systemTypesData = {
  medicines: createSystemTypeConfig({
    label: "תרופות",
    typeName: SYSTEM_TYPE_NAMES.MEDICINES,
    columnsData: MEDICINE_COLUMNS,
    orderBy: { name: TABLE_SORT_DIRECTIONS.ASC },
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את התרופה",
    deleteUrl: API_ROUTES.admin.medicine.base,
  }),
  animalColors: createSimpleSystemTypeConfig({
    label: "צבע חיה",
    typeName: SYSTEM_TYPE_NAMES.ANIMAL_COLORS,
    nameColumnLabel: "צבע חיה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את צבע החיה",
    deleteUrl: API_ROUTES.admin.animalColor.base,
  }),
  animalTypes: createSimpleSystemTypeConfig({
    label: "סוג חיה",
    typeName: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
    nameColumnLabel: "סוג חיה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג החיה",
    deleteUrl: API_ROUTES.admin.animalType.base,
  }),
  animalVitals: createSystemTypeConfig({
    label: "סוג התראה",
    typeName: SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
    columnsData: ANIMAL_VITALS_COLUMNS,
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג ההתראה",
    deleteUrl: API_ROUTES.admin.animalVitals.base,
  }),
  fecesTypes: createSimpleSystemTypeConfig({
    label: "סוג צואה",
    typeName: SYSTEM_TYPE_NAMES.FECES_TYPES,
    nameColumnLabel: "סוג צואה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הצואה",
    deleteUrl: API_ROUTES.admin.fecesType.base,
  }),
  urineTypes: createSimpleSystemTypeConfig({
    label: "סוג שתן",
    typeName: SYSTEM_TYPE_NAMES.URINE_TYPES,
    nameColumnLabel: "סוג שתן",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג השתן",
    deleteUrl: API_ROUTES.admin.urineType.base,
  }),
  foodTypes: createSimpleSystemTypeConfig({
    label: "סוג אוכל",
    typeName: SYSTEM_TYPE_NAMES.FOOD_TYPES,
    nameColumnLabel: "סוג אוכל",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג האוכל",
    deleteUrl: API_ROUTES.admin.foodType.base,
  }),
  genderTypes: createSimpleSystemTypeConfig({
    label: "מין חיה",
    typeName: SYSTEM_TYPE_NAMES.GENDER_TYPES,
    nameColumnLabel: "מין חיה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את מין החיה",
    deleteUrl: API_ROUTES.admin.genderType.base,
  }),
  raceTypes: createSystemTypeConfig({
    label: "גזע",
    typeName: SYSTEM_TYPE_NAMES.RACE_TYPES,
    columnsData: RACE_COLUMNS,
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את גזע החיה",
    deleteUrl: API_ROUTES.admin.raceType.base,
  }),
  measureUnitTypes: createSimpleSystemTypeConfig({
    label: "מידה",
    typeName: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES,
    nameColumnLabel: "שם מידה",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את המידה",
    deleteUrl: API_ROUTES.admin.measureUnitType.base,
  }),
  dosageFrequencyTypes: createSimpleSystemTypeConfig({
    label: "תדירות",
    typeName: SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את התדירות",
    deleteUrl: API_ROUTES.admin.dosageFrequencyType.base,
  }),
  insuranceTypes: createSimpleSystemTypeConfig({
    label: "ביטוח",
    typeName: SYSTEM_TYPE_NAMES.INSURANCE_TYPES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הביטוח",
    deleteUrl: API_ROUTES.admin.insuranceType.base,
  }),
  foodExtrasTypes: createSimpleSystemTypeConfig({
    label: "סוג תוספות לאוכל",
    typeName: SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג תוספות האוכל",
    deleteUrl: API_ROUTES.admin.foodExtrasType.base,
  }),
  procedureTypes: createSimpleSystemTypeConfig({
    label: "סוג פרוצדורה",
    typeName: SYSTEM_TYPE_NAMES.PROCEDURE_TYPES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הפרוצדורה",
    deleteUrl: API_ROUTES.admin.proceduresTypes.base,
  }),
  examinationTypes: createSimpleSystemTypeConfig({
    label: "סוג בדיקה",
    typeName: SYSTEM_TYPE_NAMES.EXAMINATION_TYPES,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הבדיקה",
    deleteUrl: API_ROUTES.admin.examinationType.base,
  }),
  routeOfAdministration: createSimpleSystemTypeConfig({
    label: "אופן מתן",
    typeName: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    nameColumnLabel: "שם",
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את אופן המתן",
    deleteUrl: API_ROUTES.admin.routeOfAdministration.base,
  }),
} satisfies Record<string, SystemTypeConfig>;

export type SystemTypeKey = keyof typeof systemTypesData;

export const isSystemTypeKey = (value: string): value is SystemTypeKey =>
  value in systemTypesData;
