import type { ColumnDef } from "../../../../types";
import { getFormattedDateTimeFromDBdate } from "../../../../utils/DateFormattingUtil";

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
    minWidth: "220px",
  },
  {
    colName: "תאריך יצירה",
    searchObjField: "created_at",
    minWidth: "220px",
    formatter: (cellValue: TableCellValue) => formatCreatedAtCell(cellValue),
  },
];

export const MEDICINE_COLUMNS: ColumnDef[] = [
  {
    colName: "שם תרופה",
    searchObjField: "name",
    minWidth: "120px",
  },
  {
    colName: "מקסימום",
    searchObjField: "range_max",
    minWidth: "70px",
    center: true,
  },
  {
    colName: "מינימום",
    searchObjField: "range_min",
    minWidth: "70px",
    center: true,
  },
  {
    colName: "מינון כולל",
    searchObjField: "total_dose",
    minWidth: "85px",
    center: true,
  },
  {
    colName: "mg/kg/meq",
    searchObjField: "measure_unit",
    minWidth: "85px",
    center: true,
  },
  {
    colName: "תדירות",
    searchObjField: "dosage_frequency",
    minWidth: "75px",
    center: true,
  },
  {
    colName: "אופן מתן",
    searchObjField: "route_of_administration",
    minWidth: "90px",
  },
  {
    colName: "קטגוריה",
    searchObjField: "medicine_category",
    minWidth: "95px",
  },
  {
    colName: "תאריך יצירה",
    searchObjField: "created_at",
    minWidth: "110px",
    formatter: (cellValue: TableCellValue) => formatCreatedAtCell(cellValue),
  },
  {
    colName: "הערות",
    searchObjField: "comments",
    minWidth: "120px",
    formatter: (cellValue: TableCellValue) => {
      const value = toText(cellValue);
      return value.length > 35 ? `${value.substring(0, 35)}...` : value;
    },
  },
];

export const RACE_COLUMNS: ColumnDef[] = [
  {
    colName: "גזע",
    searchObjField: "name",
    minWidth: "240px",
  },
  {
    colName: "סוג חיה",
    searchObjField: "animal_type",
    minWidth: "200px",
  },
  {
    colName: "תאריך יצירה",
    searchObjField: "created_at",
    minWidth: "220px",
    formatter: (cellValue: TableCellValue) => formatCreatedAtCell(cellValue),
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
    minWidth: "220px",
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
    colName: "תאריך יצירה",
    searchObjField: "created_at",
    minWidth: "220px",
    formatter: (cellValue: TableCellValue) => formatCreatedAtCell(cellValue),
  },
];
