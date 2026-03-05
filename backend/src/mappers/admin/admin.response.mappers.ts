import type { BaseLookup } from "@app-types/global.types";
import {
  MapperIdValue,
  MapperIdLike,
  toMapperIdString,
} from "@mappers/common/common.mappers.utils";
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
  animalTypeId?: MapperIdLike;
  minValue?: number;
  maxValue?: number;
  unit?: string;
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
  minValue: (item as LookupLike).minValue,
  maxValue: (item as LookupLike).maxValue,
  unit: (item as LookupLike).unit,
});
