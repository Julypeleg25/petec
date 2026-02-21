import type { Request, Response, NextFunction } from "express";
import { medicineService } from "@services/medicine.service";
import { sendSuccess } from "@utils/apiResponse";
import { getValidatedParams } from "@utils/request.utils";
import type { CategoryIdParamsDTO } from "@petec/shared";
import {
  SimpleSystemTypeListResponseDTOSchema,
  MedicineListResponseDTOSchema,
} from "@petec/shared";

export class MedicineController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getAll();
      sendSuccess(res, result, MedicineListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getAllByCategoryType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = getValidatedParams<CategoryIdParamsDTO>(req);
      const result = await medicineService.getAllByCategoryType(categoryId);
      sendSuccess(res, result, MedicineListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getAllCategoryTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getAllCategoryTypes();
      sendSuccess(res, result, SimpleSystemTypeListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getMedicinesFrequencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getMedicinesFrequencies();
      sendSuccess(res, result, SimpleSystemTypeListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getMedicinesRoutesForAdministration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getMedicinesRoutesForAdministration();
      sendSuccess(res, result, SimpleSystemTypeListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getMeasureUnitTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await medicineService.getMeasureUnitTypes();
      sendSuccess(res, result, SimpleSystemTypeListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }
}

export const medicineController = new MedicineController();
