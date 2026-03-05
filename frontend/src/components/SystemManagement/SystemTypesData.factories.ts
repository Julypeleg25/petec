import type { SystemTypeName } from "@petec/shared";
import type { SystemTypeConfig } from "./SystemTypesData.types";
import type { ColumnDef } from "../../types";
import type { OrderByObj } from "../../utils/TableGenerator/TableGenerator.types";
import { createNameAndCreatedAtColumns } from "./SystemTypesData.columns";
import type { SystemTypeValue } from "./SystemTypesData.types";

type SimpleConfigParams = {
  typeName: SystemTypeName;
  query: SystemTypeConfig["query"];
  systemType: SystemTypeValue;
  deleteMessage: string;
  deleteUrl: string;
  nameColumnLabel: string;
};

export const createSimpleSystemTypeConfig = (
  params: SimpleConfigParams,
): SystemTypeConfig => ({
  typeName: params.typeName,
  query: params.query,
  columnsData: createNameAndCreatedAtColumns(params.nameColumnLabel),
  deleteMessage: params.deleteMessage,
  deleteUrl: params.deleteUrl,
  systemType: params.systemType,
});

type ConfigParams = {
  typeName: SystemTypeName;
  query: SystemTypeConfig["query"];
  columnsData: ColumnDef[];
  deleteMessage: string;
  deleteUrl: string;
  systemType: SystemTypeValue;
  orderBy?: OrderByObj;
};

export const createSystemTypeConfig = (
  params: ConfigParams,
): SystemTypeConfig => ({
  typeName: params.typeName,
  query: params.query,
  columnsData: params.columnsData,
  orderBy: params.orderBy,
  deleteMessage: params.deleteMessage,
  deleteUrl: params.deleteUrl,
  systemType: params.systemType,
});
