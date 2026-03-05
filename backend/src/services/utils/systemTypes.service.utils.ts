import { systemTypesRepository } from "@repositories/systemTypes.repository";
import { BadRequestError } from "@constants/error.constants";
import type { BaseLookup } from "@app-types/global.types";
import type { SystemTypeName } from "@petec/shared";

const trimLookupName = (
  value?: BaseLookup["name"],
): BaseLookup["name"] | undefined =>
  typeof value === "string" ? value.trim() : value;

export const ensureSystemTypeNameIsUnique = async (
  typeName: SystemTypeName,
  name: string,
  excludeId?: string,
): Promise<void> => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return;
  }

  const existing = excludeId
    ? await systemTypesRepository.findByNameIncludingDeletedExceptId(
      typeName,
      trimmedName,
      excludeId,
    )
    : await systemTypesRepository.findByNameIncludingDeleted(typeName, trimmedName);

  if (!existing) {
    return;
  }

  const existingName = existing.name ?? trimmedName;
  if (existing.isDeleted) {
    throw new BadRequestError(
      `${typeName} "${existingName}" already exists and is deleted`,
    );
  }

  throw new BadRequestError(`${typeName} "${existingName}" already exists`);
};

export const toCreateSystemTypePayload = (
  data: Partial<BaseLookup>,
): Partial<BaseLookup> => {
  const { isDeleted: _ignoredIsDeleted, ...restData } = data;
  return {
    ...restData,
    name: trimLookupName(restData.name),
    isDeleted: false,
  };
};

export const toUpdateSystemTypePayload = (
  data: Partial<BaseLookup>,
): Partial<BaseLookup> => {
  const { isDeleted: _ignoredIsDeleted, ...restData } = data;
  return {
    ...restData,
    name: trimLookupName(restData.name),
  };
};
