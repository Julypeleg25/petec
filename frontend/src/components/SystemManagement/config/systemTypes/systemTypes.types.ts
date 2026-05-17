import { type SystemTypeName } from "@petec/shared";
import type { ColumnDef } from "../../../../types";
import type { OrderByObj } from "../../../../utils/TableGenerator/TableGenerator.types";

export interface SystemTypeConfig {
  label: string;
  query: SystemTypeName;
  columnsData: ColumnDef[];
  orderBy?: OrderByObj;
  deleteMessage: string;
  deleteUrl: string;
  typeName: SystemTypeName;
}
