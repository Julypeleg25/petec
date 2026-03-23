import { systemTypesRepository } from "../../../repositories/admin/index.js";
import { BadRequestError } from "../../../constants/error.constants.js";
import type { BaseLookup } from "../../../types/global.types.js";
import { SYSTEM_TYPE_NAMES, type SystemTypeName } from "@petec/shared";

type SystemTypeMutationPayload = Partial<BaseLookup> & {
  vitalsType?: string | null;
  rangeMin?: number | null;
  rangeMax?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
};

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
  typeName: SystemTypeName,
  data: SystemTypeMutationPayload,
): SystemTypeMutationPayload => {
  const { isDeleted: _ignoredIsDeleted, ...restData } = data;
  const basePayload: SystemTypeMutationPayload = {
    ...restData,
    name: trimLookupName(restData.name),
    isDeleted: false,
  };

  if (typeName !== SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
    return basePayload;
  }

  const {
    minValue,
    maxValue,
    rangeMin: currentRangeMin,
    rangeMax: currentRangeMax,
    vitalsType,
    name,
    ...restVitalsData
  } = basePayload;

  const normalizedVitalsType = trimLookupName(vitalsType ?? name);
  const normalizedRangeMin = currentRangeMin ?? minValue;
  const normalizedRangeMax = currentRangeMax ?? maxValue;

  return {
    ...restVitalsData,
    ...(normalizedVitalsType ? { vitalsType: normalizedVitalsType, name: normalizedVitalsType } : {}),
    ...(normalizedRangeMin !== undefined ? { rangeMin: normalizedRangeMin } : {}),
    ...(normalizedRangeMax !== undefined ? { rangeMax: normalizedRangeMax } : {}),
    isDeleted: false,
  };
};

export const toUpdateSystemTypePayload = (
  typeName: SystemTypeName,
  data: SystemTypeMutationPayload,
): SystemTypeMutationPayload => {
  const { isDeleted: _ignoredIsDeleted, ...restData } = data;
  const basePayload: SystemTypeMutationPayload = {
    ...restData,
    name: trimLookupName(restData.name),
  };

  if (typeName !== SYSTEM_TYPE_NAMES.ANIMAL_VITALS) {
    return basePayload;
  }

  const {
    minValue,
    maxValue,
    rangeMin: currentRangeMin,
    rangeMax: currentRangeMax,
    vitalsType,
    name,
    ...restVitalsData
  } = basePayload;

  const normalizedVitalsType = trimLookupName(vitalsType ?? name);
  const normalizedRangeMin = currentRangeMin ?? minValue;
  const normalizedRangeMax = currentRangeMax ?? maxValue;

  return {
    ...restVitalsData,
    ...(normalizedVitalsType ? { vitalsType: normalizedVitalsType, name: normalizedVitalsType } : {}),
    ...(normalizedRangeMin !== undefined ? { rangeMin: normalizedRangeMin } : {}),
    ...(normalizedRangeMax !== undefined ? { rangeMax: normalizedRangeMax } : {}),
  };
};
