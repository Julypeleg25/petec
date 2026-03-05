import { useQuery } from "@tanstack/react-query";
import { medicineApi } from "../medicine.api";

export const medicineKeys = {
    all: ["medicines"] as const,
    list: () => ["medicines", "list"] as const,
    byCategory: (categoryId: string) => ["medicines", "byCategory", categoryId] as const,
    categories: () => ["medicines", "categories"] as const,
    frequencies: () => ["medicines", "frequencies"] as const,
    routesOfAdministration: () => ["medicines", "routesOfAdministration"] as const,
    measureUnitTypes: () => ["medicines", "measureUnitTypes"] as const,
};

export const useMedicines = () =>
    useQuery({
        queryKey: medicineKeys.list(),
        queryFn: medicineApi.getAll,
    });

export const useMedicinesByCategory = (categoryId: string) =>
    useQuery({
        queryKey: medicineKeys.byCategory(categoryId),
        queryFn: () => medicineApi.getAllByCategoryType(categoryId),
        enabled: !!categoryId,
    });

export const useMedicineCategories = () =>
    useQuery({
        queryKey: medicineKeys.categories(),
        queryFn: medicineApi.getAllCategoryTypes,
    });

export const useFrequencies = () =>
    useQuery({
        queryKey: medicineKeys.frequencies(),
        queryFn: medicineApi.getFrequencies,
    });

export const useRoutesOfAdministration = () =>
    useQuery({
        queryKey: medicineKeys.routesOfAdministration(),
        queryFn: medicineApi.getRoutesOfAdministration,
    });

export const useMeasureUnitTypes = () =>
    useQuery({
        queryKey: medicineKeys.measureUnitTypes(),
        queryFn: medicineApi.getMeasureUnitTypes,
    });
