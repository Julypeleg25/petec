import type { BaseLookup } from "../../types/global.types.js";
import {
  MapperIdValue,
  MapperReferenceId,
  toMapperIdString,
} from "../common/common.mappers.utils.js";
import type {
  AnimalVitalDTO,
  RaceTypeDTO,
  SimpleSystemTypeDTO,
} from "@petec/shared";

type LookupLike = BaseLookup & {
  _id?: MapperIdValue;
  name?: string;
  isDeleted?: boolean;
  serialId?: string;
  animalTypeId?: MapperReferenceId;
  vitalsType?: string;
  rangeMin?: number;
  rangeMax?: number;
};

export const toSimpleSystemTypeDTO = (
  item: BaseLookup,
): SimpleSystemTypeDTO => ({
  id: toMapperIdString((item as LookupLike)._id),
  name: String((item as LookupLike).name ?? ""),
  isDeleted: (item as LookupLike).isDeleted,
  serialId: (item as LookupLike).serialId,
});

export const toRaceTypeDTO = (item: BaseLookup): RaceTypeDTO => ({
  ...toSimpleSystemTypeDTO(item),
  animalTypeId: toMapperIdString((item as LookupLike).animalTypeId),
});

export const toAnimalVitalDTO = (item: BaseLookup): AnimalVitalDTO => ({
  ...toSimpleSystemTypeDTO(item),
  animalTypeId: toMapperIdString((item as LookupLike).animalTypeId),
  vitalsType: (item as LookupLike).vitalsType,
  rangeMin: (item as LookupLike).rangeMin,
  rangeMax: (item as LookupLike).rangeMax,
});
