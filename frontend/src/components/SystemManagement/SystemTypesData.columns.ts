import type { ColumnDef } from "../../types";
import { getFormattedDateTimeFromDBdate } from "../../utils/DateFormattingUtil";

type TableCellValue = string | number | boolean | null | undefined | object;

const toText = (value: TableCellValue): string => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
};

const formatCreatedAtCell = (value: TableCellValue): string =>
  typeof value === "string" || value instanceof Date
    ? getFormattedDateTimeFromDBdate(value)
    : "";

export const createNameAndCreatedAtColumns = (
  nameLabel: string
): ColumnDef[] => [
  {
    colName: nameLabel,
    searchObjField: "name",
    minWidth: "150px",
  },
  {
    colName: "תאריך יצירה",
    searchObjField: "created_at",
    minWidth: "150px",
    formatter: (cellValue: TableCellValue) => formatCreatedAtCell(cellValue),
  },
];

export const MEDICINE_COLUMNS: ColumnDef[] = [
  {
    colName: "שם תרופה",
    searchObjField: "name",
    minWidth: "180px",
  },
  {
    colName: "טווח - מקסימום",
    searchObjField: "range_max",
    minWidth: "140px",
  },
  {
    colName: "טווח - מינימום",
    searchObjField: "range_min",
    minWidth: "140px",
  },
  {
    colName: "מינון כולל",
    searchObjField: "total_dose",
    minWidth: "140px",
  },
  {
    colName: "תדירות",
    searchObjField: "dosage_frequency",
    minWidth: "140px",
  },
  {
    colName: "אופן מתן",
    searchObjField: "route_of_administration",
    minWidth: "140px",
  },
  {
    colName: "קטגוריה",
    searchObjField: "medicine_category",
    minWidth: "140px",
  },
  {
    colName: "mg/kg/meq",
    searchObjField: "measure_unit",
    minWidth: "140px",
  },
  {
    colName: "תאריך יצירה",
    searchObjField: "created_at",
    minWidth: "180px",
    formatter: (cellValue: TableCellValue) => formatCreatedAtCell(cellValue),
  },
  {
    colName: "הערות",
    searchObjField: "comments",
    minWidth: "240px",
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
    minWidth: "150px",
  },
  {
    colName: "סוג חיה",
    searchObjField: "animal_type",
    minWidth: "120px",
  },
  {
    colName: "תאריך יצירה",
    searchObjField: "created_at",
    minWidth: "150px",
    formatter: (cellValue: TableCellValue) => formatCreatedAtCell(cellValue),
  },
];

export const ANIMAL_VITALS_COLUMNS: ColumnDef[] = [
  {
    colName: "סוג חיה",
    searchObjField: "animal_type",
    minWidth: "120px",
  },
  {
    colName: "סוג התראה",
    searchObjField: "vitals_type",
    minWidth: "120px",
  },
  {
    colName: "טווח - מקסימום",
    searchObjField: "range_max",
    minWidth: "120px",
  },
  {
    colName: "טווח - מינימום",
    searchObjField: "range_min",
    minWidth: "120px",
  },
  {
    colName: "תאריך יצירה",
    searchObjField: "created_at",
    minWidth: "150px",
    formatter: (cellValue: TableCellValue) => formatCreatedAtCell(cellValue),
  },
];
