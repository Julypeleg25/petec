import { Request, Response, NextFunction } from "express";
import { systemTypesService } from "@services/systemTypes.service";
import { userService } from "@services/user.service";
import type { UpdateUserDTO } from "@petec/shared";
import { sendSuccess, sendCreated, sendNoContent } from "@utils/apiResponse";
import { getParam } from "@utils/request.utils";
import type { SystemTypeName, AdminUserEditDTO, CreateTypeDTO, EditTypeDTO } from "@petec/shared";
import type { BaseLookup } from "@utils/types";

export class AdminController {
    async getAllTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const typeName = getParam(req, "typeName") as SystemTypeName;
            const result = await systemTypesService.getAllIncludingInactive(typeName);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async getActiveTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const typeName = getParam(req, "typeName") as SystemTypeName;
            const result = await systemTypesService.getAll(typeName);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async createType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const typeName = getParam(req, "typeName") as SystemTypeName;
            const data = req.body as CreateTypeDTO;
            const result = await systemTypesService.create(typeName, data as unknown as Partial<BaseLookup>);
            sendCreated(res, result);
        } catch (err) {
            next(err);
        }
    };

    async updateType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const typeName = getParam(req, "typeName") as SystemTypeName;
            const id = getParam(req, "id");
            const data = req.body as EditTypeDTO;
            const result = await systemTypesService.update(typeName, id, data as unknown as Partial<BaseLookup>);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async deleteType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const typeName = getParam(req, "typeName") as SystemTypeName;
            const id = getParam(req, "id");
            await systemTypesService.remove(typeName, id);
            sendNoContent(res);
        } catch (err) {
            next(err);
        }
    };

    async getTypesByAnimalType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const typeName = getParam(req, "typeName") as SystemTypeName;
            const animalTypeId = getParam(req, "animalTypeId");
            const result = await systemTypesService.getByAnimalTypeId(typeName, animalTypeId);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await userService.getAllUsers();
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getParam(req, "userId");
            const data = req.body as AdminUserEditDTO;
            const result = await userService.updateUser(userId, data as UpdateUserDTO);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = getParam(req, "userId");
            await userService.deleteUser(userId);
            sendNoContent(res);
        } catch (err) {
            next(err);
        }
    };
}

export const adminController = new AdminController();
