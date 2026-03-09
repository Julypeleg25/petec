import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { systemTypesApi, SystemTypeCreatePayload, SystemTypeEditPayload } from "../systemTypes.api";
import { SYSTEM_TYPE_NAMES, type SystemTypeName } from "@petec/shared";

export type CreatePayload = SystemTypeCreatePayload;

export const systemTypeKeys = {
    all: ["systemTypes"] as const,
    list: (typeName: SystemTypeName) => ["systemTypes", typeName] as const,
    active: (typeName: SystemTypeName) => ["systemTypes", typeName, "active"] as const,
    byAnimal: (typeName: SystemTypeName, animalTypeId: string) =>
        ["systemTypes", typeName, "byAnimal", animalTypeId] as const,
};

export const useSystemTypes = (typeName: SystemTypeName) =>
    useQuery({
        queryKey: systemTypeKeys.list(typeName),
        queryFn: () => systemTypesApi.getAll(typeName),
        enabled: !!typeName,
    });

export const useActiveSystemTypes = (typeName: SystemTypeName) =>
    useQuery({
        queryKey: systemTypeKeys.active(typeName),
        queryFn: () => systemTypesApi.getActive(typeName),
        enabled: !!typeName,
    });

export const useRaceTypesByAnimal = (animalTypeId: string) =>
    useQuery({
        queryKey: systemTypeKeys.byAnimal(SYSTEM_TYPE_NAMES.RACE_TYPES, animalTypeId),
        queryFn: () => systemTypesApi.getRaceTypesByAnimal(animalTypeId),
        enabled: !!animalTypeId,
    });

export const useAnimalVitalsByAnimal = (animalTypeId: string) =>
    useQuery({
        queryKey: systemTypeKeys.byAnimal(SYSTEM_TYPE_NAMES.ANIMAL_VITALS, animalTypeId),
        queryFn: () => systemTypesApi.getAnimalVitalsByAnimal(animalTypeId),
        enabled: !!animalTypeId,
    });

export const useCreateSystemType = (typeName: SystemTypeName) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: SystemTypeCreatePayload) =>
            systemTypesApi.create(typeName, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: systemTypeKeys.list(typeName) });
            toast.success("הפריט נוסף בהצלחה");
        },
    });
};

export const useUpdateSystemType = (typeName: SystemTypeName) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: SystemTypeEditPayload }) =>
            systemTypesApi.update(typeName, id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: systemTypeKeys.list(typeName) });
            toast.success("הפריט עודכן בהצלחה");
        },
    });
};

export const useDeleteSystemType = (typeName: SystemTypeName) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => systemTypesApi.delete(typeName, id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: systemTypeKeys.list(typeName) });
            toast.success("הפריט נמחק");
        },
    });
};
