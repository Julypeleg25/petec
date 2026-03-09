import { systemTypesRepository } from "@repositories/systemTypes.repository";
import { logger } from "@config/logger";
import { NotFoundError } from "@constants/error.constants";
import type { SystemTypeName } from "@petec/shared";
import type { BaseLookup } from "@app-types/global.types";
import {
  ensureSystemTypeNameIsUnique,
  toCreateSystemTypePayload,
  toUpdateSystemTypePayload,
} from "@services/utils/systemTypes.service.utils";

const ADMIN_MODULE = "admin";
export class SystemTypesService {
  async getAll(typeName: SystemTypeName): Promise<BaseLookup[]> {
    const docs = await systemTypesRepository.findActive(typeName);
    return docs.map((d) => d.toObject());
  }

  async getAllIncludingInactive(
    typeName: SystemTypeName,
  ): Promise<BaseLookup[]> {
    const docs = await systemTypesRepository.findAll(typeName);
    return docs.map((d) => d.toObject());
  }

  async getById(typeName: SystemTypeName, id: string): Promise<BaseLookup> {
    const doc = await systemTypesRepository.findById(typeName, id);
    if (!doc) {
      throw new NotFoundError(`${typeName} with id ${id} not found`);
    }
    return doc.toObject();
  }

  async create(
    typeName: SystemTypeName,
    data: Partial<BaseLookup>,
  ): Promise<BaseLookup> {
    if (typeof data.name === "string") {
      await ensureSystemTypeNameIsUnique(typeName, data.name);
    }

    const payload = toCreateSystemTypePayload(typeName, data);

    const doc = await systemTypesRepository.create(typeName, payload);
    logger.info("System type created", {
      module: ADMIN_MODULE,
      type_name: typeName,
      id: doc._id.toString(),
    });
    return doc.toObject();
  }

  async update(
    typeName: SystemTypeName,
    id: string,
    data: Partial<BaseLookup>,
  ): Promise<BaseLookup> {
    if (typeof data.name === "string") {
      await ensureSystemTypeNameIsUnique(typeName, data.name, id);
    }

    const payload = toUpdateSystemTypePayload(typeName, data);

    const doc = await systemTypesRepository.update(typeName, id, payload);
    if (!doc) {
      throw new NotFoundError(`${typeName} with id ${id} not found`);
    }
    logger.info("System type updated", {
      module: ADMIN_MODULE,
      type_name: typeName,
      id,
    });
    return doc.toObject();
  }

  async remove(typeName: SystemTypeName, id: string): Promise<void> {
    const doc = await systemTypesRepository.remove(typeName, id);
    if (!doc) {
      throw new NotFoundError(`${typeName} with id ${id} not found`);
    }
    logger.info("System type deleted", {
      module: ADMIN_MODULE,
      type_name: typeName,
      id,
    });
  }

  async getByAnimalTypeId(
    typeName: SystemTypeName,
    animalTypeId: string,
  ): Promise<BaseLookup[]> {
    const docs = await systemTypesRepository.findByAnimalTypeId(
      typeName,
      animalTypeId,
    );
    return docs.map((d) => d.toObject());
  }
}

export const systemTypesService = new SystemTypesService();
