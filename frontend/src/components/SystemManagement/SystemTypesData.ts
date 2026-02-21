import { API_ROUTES } from "../../config/api-routes";
import { SystemTypes, type SystemTypeConfig } from "./SystemTypesData.types";

export { SystemTypes } from "./SystemTypesData.types";
export type { SystemTypeConfig } from "./SystemTypesData.types";

export const systemTypesData: Record<string, SystemTypeConfig> = {
  medicines: {
    typeName: "medicines",
    query: "medicines",
    columnsData: [
      {
        colName: "שם תרופה",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "טווח - מקסימום",
        searchObjField: "range_max",
        minWidth: "200px",
      },
      {
        colName: "טווח - מינימום",
        searchObjField: "range_min",
        minWidth: "200px",
      },
      {
        colName: "מינון כולל",
        searchObjField: "total_dose",
        minWidth: "200px",
      },
      {
        colName: "תדירות",
        searchObjField: "dosage_frequency",
        minWidth: "200px",
      },
      {
        colName: "אופן מתן",
        searchObjField: "route_of_administration",
        minWidth: "200px",
      },
      {
        colName: "קטגוריה",
        searchObjField: "medicine_category",
        minWidth: "200px",
      },
      {
        colName: "mg/kg/meq",
        searchObjField: "measure_unit",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
      {
        colName: "הערות",
        searchObjField: "comments",
        minWidth: "200px",
        formatter: (cellValue: string | number | boolean | null | undefined | object) => {
          if (cellValue === undefined || cellValue === null) return "";
          const strVal = String(cellValue);
          return strVal.length > 50
            ? strVal.substring(0, 50) + "..."
            : strVal;
        },
      },
    ],
    orderBy: { name: "ASC" },
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את התרופה",
    deleteUrl: API_ROUTES.admin.medicine.base,
    systemType: SystemTypes.MEDICINE,
  },
  animalColors: {
    typeName: "animal_colors",
    query: "animal_colors",
    columnsData: [
      {
        colName: "צבע חיה",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את צבע החיה",
    deleteUrl: API_ROUTES.admin.animalColor.base,
    systemType: SystemTypes.ANIMAL_COLOR,
  },
  animalTypes: {
    typeName: "animal_types",
    query: "animal_types",
    columnsData: [
      {
        colName: "סוג חיה",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג החיה",
    deleteUrl: API_ROUTES.admin.animalType.base,
    systemType: SystemTypes.ANIMAL_TYPE,
  },
  animalVitals: {
    typeName: "animal_vitals",
    query: "animal_vitals",
    columnsData: [
      {
        colName: "סוג חיה",
        searchObjField: "animal_type",
        minWidth: "200px",
      },
      {
        colName: "סוג התראה",
        searchObjField: "vitals_type",
        minWidth: "200px",
      },
      {
        colName: "טווח - מקסימום",
        searchObjField: "range_max",
        minWidth: "200px",
      },
      {
        colName: "טווח - מינימום",
        searchObjField: "range_min",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג ההתראה",
    deleteUrl: API_ROUTES.admin.animalVitals.base,
    systemType: SystemTypes.ANIMAL_VITALS,
  },
  fecesTypes: {
    typeName: "feces_types",
    query: "feces_types",
    columnsData: [
      {
        colName: "סוג צואה",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הצואה",
    deleteUrl: API_ROUTES.admin.fecesType.base,
    systemType: SystemTypes.FECES_TYPE,
  },
  urineTypes: {
    typeName: "urine_types",
    query: "urine_types",
    columnsData: [
      {
        colName: "סוג שתן",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג השתן",
    deleteUrl: API_ROUTES.admin.urineType.base,
    systemType: SystemTypes.URINE_TYPE,
  },
  foodTypes: {
    typeName: "food_types",
    query: "food_types",
    columnsData: [
      {
        colName: "סוג אוכל",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג האוכל",
    deleteUrl: API_ROUTES.admin.foodType.base,
    systemType: SystemTypes.FOOD_TYPE,
  },
  genderTypes: {
    typeName: "gender_types",
    query: "gender_types",
    columnsData: [
      {
        colName: "מין חיה",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את מין החיה",
    deleteUrl: API_ROUTES.admin.genderType.base,
    systemType: SystemTypes.GENDER_TYPE,
  },
  raceTypes: {
    typeName: "race_types",
    query: "race_types",
    columnsData: [
      {
        colName: "גזע",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "סוג חיה",
        searchObjField: "animal_type",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את גזע החיה",
    deleteUrl: API_ROUTES.admin.raceType.base,
    systemType: SystemTypes.RACE_TYPE,
  },
  measureUnitTypes: {
    typeName: "measure_unit_types",
    query: "measure_unit_types",
    columnsData: [
      {
        colName: "שם מידה",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את המידה",
    deleteUrl: API_ROUTES.admin.measureUnitType.base,
    systemType: SystemTypes.MEASURE_UNIT_TYPE,
  },
  dosageFrequencyTypes: {
    typeName: "dosage_frequencies",
    query: "dosage_frequencies",
    columnsData: [
      {
        colName: "שם",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תיאור",
        searchObjField: "description",
        minWidth: "200px",
      },
      {
        colName: "תיאור לפי שעה",
        searchObjField: "description_per_hour",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את התדירות",
    deleteUrl: API_ROUTES.admin.dosageFrequencyType.base,
    systemType: SystemTypes.DOSAGE_FREQUENCY_TYPE,
  },
  insuranceTypes: {
    typeName: "insurance_types",
    query: "insurance_types",
    columnsData: [
      {
        colName: "שם",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הביטוח",
    deleteUrl: API_ROUTES.admin.insuranceType.base,
    systemType: SystemTypes.INSURANCE_TYPE,
  },
  foodExtrasTypes: {
    typeName: "food_extra_types",
    query: "food_extra_types",
    columnsData: [
      {
        colName: "שם",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג תוספות האוכל",
    deleteUrl: API_ROUTES.admin.foodExtrasType.base,
    systemType: SystemTypes.FOOD_EXTRAS_TYPE,
  },
  procedureTypes: {
    typeName: "procedure_types",
    query: "procedure_types",
    columnsData: [
      {
        colName: "שם",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הפרוצדורה",
    deleteUrl: API_ROUTES.admin.proceduresTypes.base,
    systemType: SystemTypes.PROCEDURE_TYPE,
  },
  examinationTypes: {
    typeName: "examination_types",
    query: "examination_types",
    columnsData: [
      {
        colName: "שם",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את סוג הבדיקה",
    deleteUrl: API_ROUTES.admin.examinationType.base,
    systemType: SystemTypes.EXAMINATION_TYPE,
  },
  routeOfAdministration: {
    typeName: "routes_of_administration",
    query: "routes_of_administration",
    columnsData: [
      {
        colName: "שם",
        searchObjField: "name",
        minWidth: "200px",
      },
      {
        colName: "תיאור",
        searchObjField: "description",
        minWidth: "200px",
      },
      {
        colName: "תאריך יצירה",
        searchObjField: "created_at",
        minWidth: "200px",
      },
    ],
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את אופן המתן",
    deleteUrl: API_ROUTES.admin.routeOfAdministration.base,
    systemType: SystemTypes.ROUTE_OF_ADMINISTRATION,
  },
};
