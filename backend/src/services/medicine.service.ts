import { systemTypesRepository } from "@repositories/systemTypes.repository";
import type { MedicineDTO, SimpleSystemTypeDTO } from "@petec/shared";
import { Types } from "mongoose";
import type {
  MedicineLeanDoc,
  SimpleTypeLeanDoc,
} from "@app-types/medicine.types";
import {
  buildCategoryLookupFilters,
  matchesCategoryLookupValue,
  mapMedicineDocToDto,
  mapSimpleTypeDocToDto,
  MEDICINE_ACTIVE_FILTER,
  MEDICINE_SERVICE_TYPES,
  MEDICINE_SORT,
  type MedicineCategoryLeanDoc,
} from "@services/utils/medicine.service.utils";

const resolveCategoryDoc = async (
  rawCategoryValue: string,
): Promise<MedicineCategoryLeanDoc | null> => {
  const normalizedCategoryValue = rawCategoryValue.trim();
  if (!normalizedCategoryValue) {
    return null;
  }

  const categoryModel = systemTypesRepository.getModel(MEDICINE_CATEGORIES);
  const categoryLookupFilters = buildCategoryLookupFilters(
    normalizedCategoryValue,
  );

  const exactCategory = (await categoryModel
    .findOne({
      isDeleted: { $ne: true },
      $or: categoryLookupFilters,
    })
    .lean()
    .exec()) as MedicineCategoryLeanDoc | null;

  if (exactCategory) {
    return exactCategory;
  }

  const categories = (await categoryModel
    .find({ isDeleted: { $ne: true } })
    .lean()
    .exec()) as MedicineCategoryLeanDoc[];

  return (
    categories.find((category) =>
      matchesCategoryLookupValue(category, normalizedCategoryValue),
    ) ?? null
  );
};

const MEDICINES = MEDICINE_SERVICE_TYPES.MEDICINES;
const MEDICINE_CATEGORIES = MEDICINE_SERVICE_TYPES.MEDICINE_CATEGORIES;
const DOSAGE_FREQUENCIES = MEDICINE_SERVICE_TYPES.DOSAGE_FREQUENCIES;
const ROUTES_OF_ADMINISTRATION =
  MEDICINE_SERVICE_TYPES.ROUTES_OF_ADMINISTRATION;
const MEASURE_UNIT_TYPES = MEDICINE_SERVICE_TYPES.MEASURE_UNIT_TYPES;

export class MedicineService {
  async getAll(): Promise<MedicineDTO[]> {
    const model = systemTypesRepository.getModel(MEDICINES);
    const docs = await model
      .find(MEDICINE_ACTIVE_FILTER)
      .populate("categoryId")
      .populate("measureUnitId")
      .populate("dosageFrequencyId")
      .populate("routeOfAdministrationId")
      .sort(MEDICINE_SORT)
      .lean()
      .exec();
    return (docs as MedicineLeanDoc[]).map(mapMedicineDocToDto);
  }

  async getAllByCategoryType(categoryValue: string): Promise<MedicineDTO[]> {
    const category = await resolveCategoryDoc(categoryValue);

    if (!category) {
      return [];
    }

    const model = systemTypesRepository.getModel(MEDICINES);
    const docs = await model
      .find({
        ...MEDICINE_ACTIVE_FILTER,
        $or: [{ categoryId: category._id }, { category_id: category._id }],
      })
      .populate("categoryId")
      .populate("measureUnitId")
      .populate("dosageFrequencyId")
      .populate("routeOfAdministrationId")
      .sort(MEDICINE_SORT)
      .lean()
      .exec();
    return (docs as MedicineLeanDoc[]).map(mapMedicineDocToDto);
  }

  async getAllCategoryTypes(): Promise<SimpleSystemTypeDTO[]> {
    const docs = await systemTypesRepository.findActive(MEDICINE_CATEGORIES);
    return docs.map((d) =>
      mapSimpleTypeDocToDto(d.toObject() as SimpleTypeLeanDoc),
    );
  }

  async getMedicinesFrequencies(): Promise<SimpleSystemTypeDTO[]> {
    const docs = await systemTypesRepository.findActive(DOSAGE_FREQUENCIES);
    return docs.map((d) =>
      mapSimpleTypeDocToDto(d.toObject() as SimpleTypeLeanDoc),
    );
  }

  async getMedicinesRoutesForAdministration(): Promise<SimpleSystemTypeDTO[]> {
    const docs = await systemTypesRepository.findActive(
      ROUTES_OF_ADMINISTRATION,
    );
    return docs.map((d) =>
      mapSimpleTypeDocToDto(d.toObject() as SimpleTypeLeanDoc),
    );
  }

  async getMeasureUnitTypes(): Promise<SimpleSystemTypeDTO[]> {
    const docs = await systemTypesRepository.findActive(MEASURE_UNIT_TYPES);
    return docs.map((d) =>
      mapSimpleTypeDocToDto(d.toObject() as SimpleTypeLeanDoc),
    );
  }
}

export const medicineService = new MedicineService();
