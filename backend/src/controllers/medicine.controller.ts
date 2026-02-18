import { Request, Response, NextFunction } from "express";
import { systemTypesRepository } from "@repositories/systemTypes.repository";
import { ErrorCode, HttpStatus, SYSTEM_TYPE_NAMES, AppError } from "@petec/shared";

export class MedicineController {
    public getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const model = systemTypesRepository.getModel(SYSTEM_TYPE_NAMES.MEDICINES);
            const medicines = await model.find({ isActive: true })
                .populate("categoryId")
                .populate("measureUnitId")
                .populate("dosageFrequencyId")
                .populate("routeOfAdministrationId")
                .sort({ name: 1 })
                .exec();
            res.status(HttpStatus.OK).json({ success: true, data: medicines });
        } catch (error) {
            next(error);
        }
    };

    public getAllByCategoryType = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categoryId = req.params.categoryId;
            const model = systemTypesRepository.getModel(SYSTEM_TYPE_NAMES.MEDICINES);
            const query = categoryId ? { isActive: true, categoryId } : { isActive: true };

            const medicines = await model.find(query)
                .populate("categoryId")
                .populate("measureUnitId")
                .populate("dosageFrequencyId")
                .populate("routeOfAdministrationId")
                .sort({ name: 1 })
                .exec();

            res.status(HttpStatus.OK).json({ success: true, data: medicines });
        } catch (error) {
            next(error);
        }
    };

    public getAllCategoryTypes = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = await systemTypesRepository.findActive(SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES);
            res.status(HttpStatus.OK).json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    };

    public getMedicinesFrequencies = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const frequencies = await systemTypesRepository.findActive(SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES);
            res.status(HttpStatus.OK).json({ success: true, data: frequencies });
        } catch (error) {
            next(error);
        }
    };

    public getMedicinesRoutesForAdministration = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const routes = await systemTypesRepository.findActive(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION);
            res.status(HttpStatus.OK).json({ success: true, data: routes });
        } catch (error) {
            next(error);
        }
    };

    public getMeasureUnitTypes = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const units = await systemTypesRepository.findActive(SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES);
            res.status(HttpStatus.OK).json({ success: true, data: units });
        } catch (error) {
            next(error);
        }
    };
}

export const medicineController = new MedicineController();
