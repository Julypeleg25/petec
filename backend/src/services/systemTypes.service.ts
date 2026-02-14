import { systemTypesRepository } from "@repositories/systemTypes.repository";
import { NotFoundError } from "@utils/errors";
import type { SystemTypeName } from "@petec/shared";
import type { BaseLookup } from "@utils/types";

export class SystemTypesService {
    async getAll(typeName: SystemTypeName): Promise<BaseLookup[]> {
        const docs = await systemTypesRepository.findActive(typeName);
        return docs.map((d) => d.toObject());
    };

    async getAllIncludingInactive(typeName: SystemTypeName): Promise<BaseLookup[]> {
        const docs = await systemTypesRepository.findAll(typeName);
        return docs.map((d) => d.toObject());
    };

    async getById(typeName: SystemTypeName, id: string): Promise<BaseLookup> {
        const doc = await systemTypesRepository.findById(typeName, id);
        if (!doc) {
            throw new NotFoundError(`${typeName} with id ${id} not found`);
        }
        return doc.toObject();
    };

    async create(typeName: SystemTypeName, data: Partial<BaseLookup>): Promise<BaseLookup> {
        const doc = await systemTypesRepository.create(typeName, data);
        return doc.toObject();
    };

    async update(typeName: SystemTypeName, id: string, data: Partial<BaseLookup>): Promise<BaseLookup> {
        const doc = await systemTypesRepository.update(typeName, id, data);
        if (!doc) {
            throw new NotFoundError(`${typeName} with id ${id} not found`);
        }
        return doc.toObject();
    };

    async remove(typeName: SystemTypeName, id: string): Promise<void> {
        const doc = await systemTypesRepository.remove(typeName, id);
        if (!doc) {
            throw new NotFoundError(`${typeName} with id ${id} not found`);
        }
    };

    async getByAnimalTypeId(typeName: SystemTypeName, animalTypeId: string): Promise<BaseLookup[]> {
        const docs = await systemTypesRepository.findByAnimalTypeId(typeName, animalTypeId);
        return docs.map((d) => d.toObject());
    };
}

export const systemTypesService = new SystemTypesService();
