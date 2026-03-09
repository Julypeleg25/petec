import { systemTypesRepository } from "@repositories/systemTypes.repository";
import type {
  MedicineDTO,
  MedicineCategoryType,
  SimpleSystemTypeDTO,
} from "@petec/shared";
import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import type {
  MedicineLeanDoc,
  SimpleTypeLeanDoc,
} from "@app-types/medicine.types";
import {
  MEDICINE_ACTIVE_FILTER,
  MEDICINE_SORT,
  type MedicineCategoryLeanDoc,
} from "@services/utils/medicine.service.utils";
import {
  mapMedicineDocToDto,
  mapSimpleTypeDocToDto,
} from "@mappers/medicine/medicine.mappers";

const resolveCategoryDoc = async (
  categoryType: MedicineCategoryType,
): Promise<MedicineCategoryLeanDoc | null> => {
  const categoryModel = systemTypesRepository.getModel(MEDICINE_CATEGORIES);
  return (await categoryModel
    .findOne({
      isDeleted: { $ne: true },
      type: categoryType,
    })
    .lean()
    .exec()) as MedicineCategoryLeanDoc | null;
};

const MEDICINES = SYSTEM_TYPE_NAMES.MEDICINES;
const MEDICINE_CATEGORIES = SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES;
const DOSAGE_FREQUENCIES = SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES;
const ROUTES_OF_ADMINISTRATION =
  SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION;
const MEASURE_UNIT_TYPES = SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES;

export class MedicineService {
  async getAll(): Promise<MedicineDTO[]> {
    const model = systemTypesRepository.getModel(MEDICINES);
    const docs = await model
      .find(MEDICINE_ACTIVE_FILTER)
      .populate("categoryId")
      .populate("measureUnitTypeId")
      .populate("dosageFrequencyId")
      .populate("routeOfAdministrationId")
      .sort(MEDICINE_SORT)
      .lean()
      .exec();
    return (docs as MedicineLeanDoc[]).map(mapMedicineDocToDto);
  }

  async getAllByCategoryType(categoryType: MedicineCategoryType): Promise<MedicineDTO[]> {
    const category = await resolveCategoryDoc(categoryType);

    if (!category) {
      return [];
    }

    const model = systemTypesRepository.getModel(MEDICINES);
    const docs = await model
      .find({
        ...MEDICINE_ACTIVE_FILTER,
        categoryId: category._id,
      })
      .populate("categoryId")
      .populate("measureUnitTypeId")
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
