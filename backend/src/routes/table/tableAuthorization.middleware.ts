import type { NextFunction, Request, Response } from "express";
import {
  BASE_TABLE_NAMES,
  Permission,
  type AllowedTableName,
  type GetTableDataDTO,
} from "@petec/shared";
import { requirePermission } from "../../middlewares/auth.middleware.js";
import { getValidatedBody } from "../../utils/request.utils.js";

const TABLE_READ_PERMISSIONS: Partial<Record<AllowedTableName, Permission>> = {
  [BASE_TABLE_NAMES[0]]: Permission.READ_PATIENT,
  [BASE_TABLE_NAMES[1]]: Permission.READ_CASE,
  [BASE_TABLE_NAMES[2]]: Permission.READ_AUDIT,
  [BASE_TABLE_NAMES[3]]: Permission.MANAGE_USERS,
};

export const requireTableReadPermission = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { tableName } = getValidatedBody<GetTableDataDTO>(req);
  const permission =
    TABLE_READ_PERMISSIONS[tableName] ?? Permission.MANAGE_SYSTEM_TYPES;

  requirePermission(permission)(req, res, next);
};
