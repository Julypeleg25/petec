import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { systemTypesApi, SystemTypeCreatePayload, SystemTypeEditPayload } from "../systemTypes.api";
import { SYSTEM_TYPE_NAMES, type SystemTypeName } from "@petec/shared";
import { systemTypeKeys } from "./systemTypes.keys";

export type CreatePayload = SystemTypeCreatePayload;

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
        queryKey: systemTypeKeys.raceTypesByAnimal(animalTypeId),
        queryFn: () => systemTypesApi.getRaceTypesByAnimal(animalTypeId),
        enabled: !!animalTypeId,
    });

export const useAnimalVitalsByAnimal = (animalTypeId: string) =>
    useQuery({
        queryKey: systemTypeKeys.animalVitalsByAnimal(animalTypeId),
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
