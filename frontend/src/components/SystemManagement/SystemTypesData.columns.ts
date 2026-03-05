import type { ColumnDef } from "../../types";

type TableCellValue = string | number | boolean | null | undefined | object;

const toText = (value: TableCellValue): string => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
};

export const createNameAndCreatedAtColumns = (
  nameLabel: string,
): ColumnDef[] => [
  {
    colName: nameLabel,
    searchObjField: "name",
    minWidth: "200px",
  },
  {
    colName: "תאריך יצירה",
    searchObjField: "created_at",
    minWidth: "200px",
  },
];

export const MEDICINE_COLUMNS: ColumnDef[] = [
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
    formatter: (cellValue: TableCellValue) => {
      const value = toText(cellValue);
      return value.length > 50 ? `${value.substring(0, 50)}...` : value;
    },
  },
];

export const RACE_COLUMNS: ColumnDef[] = [
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
];

export const ANIMAL_VITALS_COLUMNS: ColumnDef[] = [
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
];
