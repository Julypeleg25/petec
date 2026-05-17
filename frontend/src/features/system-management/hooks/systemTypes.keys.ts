import { SYSTEM_TYPE_NAMES, type SystemTypeName } from "@petec/shared";

export const systemTypeKeys = {
  all: ["systemTypes"] as const,
  list: (typeName: SystemTypeName) => ["systemTypes", typeName, "list"] as const,
  active: (typeName: SystemTypeName) => ["systemTypes", typeName, "active"] as const,
  byAnimal: (typeName: SystemTypeName, animalTypeId: string) =>
    ["systemTypes", typeName, "byAnimal", animalTypeId] as const,
  raceTypesByAnimal: (animalTypeId: string) =>
    ["systemTypes", SYSTEM_TYPE_NAMES.RACE_TYPES, "byAnimal", animalTypeId] as const,
  animalVitalsByAnimal: (animalTypeId: string) =>
    ["systemTypes", SYSTEM_TYPE_NAMES.ANIMAL_VITALS, "byAnimal", animalTypeId] as const,
};
