import { globals } from "../../utils/Globals";

export enum SystemTypes {
  MEDICINE = "MEDICINE",
  ANIMAL_COLOR = "ANIMAL_COLOR",
  ANIMAL_TYPE = "ANIMAL_TYPE",
  FECES_TYPE = "FECES_TYPE",
  URINE_TYPE = "URINE_TYPE",
  FOOD_TYPE = "FOOD_TYPE",
  GENDER_TYPE = "GENDER_TYPE",
  RACE_TYPE = "RACE_TYPE",
  MEASURE_UNIT_TYPE = "MEASURE_UNIT_TYPE",
  DOSAGE_FREQUENCY_TYPE = "DOSAGE_FREQUENCY_TYPE",
  INSURANCE_TYPE = "INSURANCE_TYPE",
  FOOD_EXTRAS_TYPE = "FOOD_EXTRAS_TYPE",
  EXAMINATION_TYPE = "EXAMINATION_TYPE",
  ROUTE_OF_ADMINISTRATION = "ROUTE_OF_ADMINISTRATION",
  PROCEDURE_TYPE = "PROCEDURE_TYPE",
  ANIMAL_VITALS = "ANIMAL_VITALS",
}

export const systemTypesData = {
  medicines: {
    query: "getMedicines",
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
        formatter: (cellValue: any, rowData: any) => {
          if (cellValue === undefined || cellValue === null) return "";
          return cellValue.length > 50
            ? cellValue.substring(0, 50) + "..."
            : cellValue;
        },
      },
    ],
    orderBy: { name: "ASC" },
    deleteMessage: "?האם אתה בטוח שאת/ה רוצה למחוק את התרופה",
    deleteUrl: globals.admin.medicine.delete,
    systemType: SystemTypes.MEDICINE,
  },
  animalColors: {
    query: "getAnimalColors",
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
    deleteUrl: globals.admin.animalColor.delete,
    systemType: SystemTypes.ANIMAL_COLOR,
  },
  animalTypes: {
    query: "getAnimalTypes",
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
    deleteUrl: globals.admin.animalType.delete,
    systemType: SystemTypes.ANIMAL_TYPE,
  },
  animalVitals: {
    query: "getAnimalVitals",
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
    deleteUrl: globals.admin.animalVitals.delete,
    systemType: SystemTypes.ANIMAL_VITALS,
  },
  fecesTypes: {
    query: "getFecesTypes",
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
    deleteUrl: globals.admin.fecesType.delete,
    systemType: SystemTypes.FECES_TYPE,
  },
  urineTypes: {
    query: "getUrineTypes",
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
    deleteUrl: globals.admin.urineType.delete,
    systemType: SystemTypes.URINE_TYPE,
  },
  foodTypes: {
    query: "getFoodTypes",
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
    deleteUrl: globals.admin.foodType.delete,
    systemType: SystemTypes.FOOD_TYPE,
  },
  genderTypes: {
    query: "getGenderTypes",
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
    deleteUrl: globals.admin.genderType.delete,
    systemType: SystemTypes.GENDER_TYPE,
  },
  raceTypes: {
    query: "getRaceTypes",
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
    deleteUrl: globals.admin.raceType.delete,
    systemType: SystemTypes.RACE_TYPE,
  },
  measureUnitTypes: {
    query: "getMeasureUnitTypes",
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
    deleteUrl: globals.admin.measureUnitType.delete,
    systemType: SystemTypes.MEASURE_UNIT_TYPE,
  },
  dosageFrequencyTypes: {
    query: "getDosageFrequencyTypes",
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
    deleteUrl: globals.admin.dosageFrequencyType.delete,
    systemType: SystemTypes.DOSAGE_FREQUENCY_TYPE,
  },
  insuranceTypes: {
    query: "getInsuranceTypes",
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
    deleteUrl: globals.admin.insuranceType.delete,
    systemType: SystemTypes.INSURANCE_TYPE,
  },
  foodExtrasTypes: {
    query: "getFoodExtrasTypes",
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
    deleteUrl: globals.admin.foodExtrasType.delete,
    systemType: SystemTypes.FOOD_EXTRAS_TYPE,
  },
  procedureTypes: {
    query: "getProceduresTypes",
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
    deleteUrl: globals.admin.proceduresTypes.delete,
    systemType: SystemTypes.PROCEDURE_TYPE,
  },
  examinationTypes: {
    query: "getExaminationTypes",
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
    deleteUrl: globals.admin.examinationType.delete,
    systemType: SystemTypes.EXAMINATION_TYPE,
  },
  routeOfAdministration: {
    query: "getRouteOfAdministration",
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
    deleteUrl: globals.admin.routeOfAdministration.delete,
    systemType: SystemTypes.ROUTE_OF_ADMINISTRATION,
  },
};
