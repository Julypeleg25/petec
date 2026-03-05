import type { Request, Response, NextFunction } from "express";
import { systemTypesService } from "@services/systemTypes.service";
import { userService } from "@services/user.service";
import { sendSuccess, sendCreated, sendNoContent } from "@utils/apiResponse";
import { getValidatedBody, getValidatedParams } from "@utils/request.utils";
import type { BaseLookup } from "@app-types/global.types";
import {
  toAnimalVitalDTO,
  toRaceTypeDTO,
  toSimpleSystemTypeDTO,
} from "@mappers/admin/admin.response.mappers";
import type { UpdateUserDTO } from "@petec/shared";
import type {
  SystemTypeNameParamsDTO,
  SystemTypeNameWithIdParamsDTO,
  SystemTypeByAnimalParamsDTO,
  UserIdParamsDTO,
} from "@petec/shared";
import type {
  CreateTypeDTO,
  CreateMedicineDTO,
  CreateAnimalVitalsDTO,
  EditTypeDTO,
  EditMedicineDTO,
  EditAnimalVitalsDTO,
} from "@petec/shared";
import {
  SYSTEM_TYPE_NAMES,
  SimpleSystemTypeDTOSchema,
  SimpleSystemTypeListResponseDTOSchema,
  RaceTypeListResponseDTOSchema,
  AnimalVitalListResponseDTOSchema,
  UserRowListResponseDTOSchema,
  UserResponseDTOSchema,
} from "@petec/shared";

export class AdminController {
  async getAllTypes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { typeName } = getValidatedParams<SystemTypeNameParamsDTO>(req);
      const result = await systemTypesService.getAllIncludingInactive(typeName);
      sendSuccess(
        res,
        result.map(toSimpleSystemTypeDTO),
        SimpleSystemTypeListResponseDTOSchema,
      );
    } catch (err) {
      next(err);
    }
  }

  async getActiveTypes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { typeName } = getValidatedParams<SystemTypeNameParamsDTO>(req);
      const result = await systemTypesService.getAll(typeName);
      sendSuccess(
        res,
        result.map(toSimpleSystemTypeDTO),
        SimpleSystemTypeListResponseDTOSchema,
      );
    } catch (err) {
      next(err);
    }
  }

  async createType(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { typeName } = getValidatedParams<SystemTypeNameParamsDTO>(req);
      const data = getValidatedBody<
        CreateTypeDTO | CreateMedicineDTO | CreateAnimalVitalsDTO
      >(req);
      const result = await systemTypesService.create(
        typeName,
        data as Partial<BaseLookup>,
      );
      sendCreated(
        res,
        toSimpleSystemTypeDTO(result),
        SimpleSystemTypeDTOSchema,
      );
    } catch (err) {
      next(err);
    }
  }

  async updateType(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { typeName, id } =
        getValidatedParams<SystemTypeNameWithIdParamsDTO>(req);
      const data = getValidatedBody<
        EditTypeDTO | EditMedicineDTO | EditAnimalVitalsDTO
      >(req);
      const { id: _payloadId, ...updateData } = data;
      const result = await systemTypesService.update(
        typeName,
        id,
        updateData as Partial<BaseLookup>,
      );
      sendSuccess(
        res,
        toSimpleSystemTypeDTO(result),
        SimpleSystemTypeDTOSchema,
      );
    } catch (err) {
      next(err);
    }
  }

  async deleteType(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { typeName, id } =
        getValidatedParams<SystemTypeNameWithIdParamsDTO>(req);
      await systemTypesService.remove(typeName, id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async getTypesByAnimalType(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { typeName, animalTypeId } =
        getValidatedParams<SystemTypeByAnimalParamsDTO>(req);
      const result = await systemTypesService.getByAnimalTypeId(
        typeName,
        animalTypeId,
      );
      if (typeName === SYSTEM_TYPE_NAMES.RACE_TYPES) {
        sendSuccess(
          res,
          result.map(toRaceTypeDTO),
          RaceTypeListResponseDTOSchema,
        );
        return;
      }
      if (typeName === SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
        sendSuccess(
          res,
          result.map(toAnimalVitalDTO),
          AnimalVitalListResponseDTOSchema,
        );
        return;
      }
      sendSuccess(
        res,
        result.map(toSimpleSystemTypeDTO),
        SimpleSystemTypeListResponseDTOSchema,
      );
    } catch (err) {
      next(err);
    }
  }

  async getAllUsers(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await userService.getAllUsers();
      sendSuccess(res, result, UserRowListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = getValidatedParams<UserIdParamsDTO>(req);
      const data = getValidatedBody<UpdateUserDTO>(req);
      const result = await userService.updateUser(userId, data);
      sendSuccess(res, result, UserResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = getValidatedParams<UserIdParamsDTO>(req);
      await userService.deleteUser(userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
