import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "@utils/apiResponse";
import { getValidatedParams } from "@utils/request.utils";
import type { CategoryTypeParamsDTO } from "@petec/shared";
import {
  SimpleSystemTypeListResponseDTOSchema,
  MedicineListResponseDTOSchema,
} from "@petec/shared";
import { medicineService } from "@services/medicine";

export class MedicineController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getAll();
      sendSuccess(res, result, MedicineListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getAllByCategoryType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryType } = getValidatedParams<CategoryTypeParamsDTO>(req);
      const result = await medicineService.getAllByCategoryType(categoryType);
      sendSuccess(res, result, MedicineListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getAllCategoryTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getAllCategoryTypes();
      sendSuccess(res, result, SimpleSystemTypeListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getMedicinesFrequencies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getMedicinesFrequencies();
      sendSuccess(res, result, SimpleSystemTypeListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getMedicinesRoutesForAdministration(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getMedicinesRoutesForAdministration();
      sendSuccess(res, result, SimpleSystemTypeListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getMeasureUnitTypes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getMeasureUnitTypes();
      sendSuccess(res, result, SimpleSystemTypeListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }
}

export const medicineController = new MedicineController();
