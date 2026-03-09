import type { SystemTypeName } from "@petec/shared";
import type { SystemTypeConfig } from "./SystemTypesData.types";
import type { ColumnDef } from "../../types";
import type { OrderByObj } from "../../utils/TableGenerator/TableGenerator.types";
import { createNameAndCreatedAtColumns } from "./SystemTypesData.columns";

type SimpleConfigParams = {
  label: string;
  typeName: SystemTypeName;
  deleteMessage: string;
  deleteUrl: string;
  nameColumnLabel: string;
};

export const createSimpleSystemTypeConfig = (
  params: SimpleConfigParams,
): SystemTypeConfig => ({
  label: params.label,
  typeName: params.typeName,
  query: params.typeName,
  columnsData: createNameAndCreatedAtColumns(params.nameColumnLabel),
  deleteMessage: params.deleteMessage,
  deleteUrl: params.deleteUrl,
});

type ConfigParams = {
  label: string;
  typeName: SystemTypeName;
  columnsData: ColumnDef[];
  deleteMessage: string;
  deleteUrl: string;
  orderBy?: OrderByObj;
};

export const createSystemTypeConfig = (
  params: ConfigParams,
): SystemTypeConfig => ({
  label: params.label,
  typeName: params.typeName,
  query: params.typeName,
  columnsData: params.columnsData,
  orderBy: params.orderBy,
  deleteMessage: params.deleteMessage,
  deleteUrl: params.deleteUrl,
});
