import { useQuery } from "@tanstack/react-query";
import { medicineApi } from "../medicine.api";
import type { MedicineCategoryType } from "@petec/shared";
import { medicineKeys } from "./medicine.keys";

export const useMedicines = () =>
    useQuery({
        queryKey: medicineKeys.list(),
        queryFn: medicineApi.getAll,
    });

export const useMedicinesByCategory = (categoryType: MedicineCategoryType) =>
    useQuery({
        queryKey: medicineKeys.byCategory(categoryType),
        queryFn: () => medicineApi.getAllByCategoryType(categoryType),
        enabled: !!categoryType,
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
