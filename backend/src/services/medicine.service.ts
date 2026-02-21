import { systemTypesRepository } from "@repositories/systemTypes.repository";
import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import type { MedicineDTO, SimpleSystemTypeDTO } from "@petec/shared";
import type { MedicineLeanDoc, SimpleTypeLeanDoc, PopulatedRefDoc } from "@services/medicine.service.types";

const MEDICINES = SYSTEM_TYPE_NAMES.MEDICINES;
const MEDICINE_CATEGORIES = SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES;
const DOSAGE_FREQUENCIES = SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES;
const ROUTES_OF_ADMINISTRATION = SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION;
const MEASURE_UNIT_TYPES = SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES;

const toId = (val: PopulatedRefDoc | null | undefined): string =>
  val == null ? "" : typeof val._id === "object" ? val._id.toString() : String(val._id);

function toPopulatedRef(val: PopulatedRefDoc | null | undefined): { _id: string; name: string } | undefined {
  if (val == null) return undefined;
  const name = val.name;
  return { _id: toId(val), name: typeof name === "string" ? name : "" };
}

const mapMedicineDoc = (doc: MedicineLeanDoc): MedicineDTO => ({
  id: doc._id != null ? String(doc._id) : "",
  name: String(doc.name ?? ""),
  isActive: doc.isActive,
  legacyId: doc.legacyId ?? undefined,
  measureUnitId: toPopulatedRef(doc.measureUnitId ?? undefined),
  rangeMax: doc.rangeMax ?? undefined,
  rangeMin: doc.rangeMin ?? undefined,
  totalDose: doc.totalDose ?? undefined,
  comments: doc.comments ?? undefined,
  routeOfAdministrationId: toPopulatedRef(doc.routeOfAdministrationId ?? undefined),
  dosageFrequencyId: toPopulatedRef(doc.dosageFrequencyId ?? undefined),
  categoryId: toPopulatedRef(doc.categoryId ?? undefined),
  defaultUnit: doc.defaultUnit ?? undefined,
});

const mapSimpleDoc = (doc: SimpleTypeLeanDoc): SimpleSystemTypeDTO => ({
  id: doc._id != null ? String(doc._id) : "",
  name: String(doc.name ?? ""),
  isActive: doc.isActive,
  legacyId: doc.legacyId,
});

export class MedicineService {
  async getAll(): Promise<MedicineDTO[]> {
    const model = systemTypesRepository.getModel(MEDICINES);
    const docs = await model
      .find({ isActive: true })
      .populate("categoryId")
      .populate("measureUnitId")
      .populate("dosageFrequencyId")
      .populate("routeOfAdministrationId")
      .sort({ name: 1 })
      .lean()
      .exec();
    return (docs as MedicineLeanDoc[]).map(mapMedicineDoc);
  }

  async getAllByCategoryType(categoryId: string): Promise<MedicineDTO[]> {
    const model = systemTypesRepository.getModel(MEDICINES);
    const query = categoryId ? { isActive: true, categoryId } : { isActive: true };
    const docs = await model
      .find(query)
      .populate("categoryId")
      .populate("measureUnitId")
      .populate("dosageFrequencyId")
      .populate("routeOfAdministrationId")
      .sort({ name: 1 })
      .lean()
      .exec();
    return (docs as MedicineLeanDoc[]).map(mapMedicineDoc);
  }

  async getAllCategoryTypes(): Promise<SimpleSystemTypeDTO[]> {
    const docs = await systemTypesRepository.findActive(MEDICINE_CATEGORIES);
    return docs.map((d) => mapSimpleDoc(d.toObject() as SimpleTypeLeanDoc));
  }

  async getMedicinesFrequencies(): Promise<SimpleSystemTypeDTO[]> {
    const docs = await systemTypesRepository.findActive(DOSAGE_FREQUENCIES);
    return docs.map((d) => mapSimpleDoc(d.toObject() as SimpleTypeLeanDoc));
  }

  async getMedicinesRoutesForAdministration(): Promise<SimpleSystemTypeDTO[]> {
    const docs = await systemTypesRepository.findActive(ROUTES_OF_ADMINISTRATION);
    return docs.map((d) => mapSimpleDoc(d.toObject() as SimpleTypeLeanDoc));
  }

  async getMeasureUnitTypes(): Promise<SimpleSystemTypeDTO[]> {
    const docs = await systemTypesRepository.findActive(MEASURE_UNIT_TYPES);
    return docs.map((d) => mapSimpleDoc(d.toObject() as SimpleTypeLeanDoc));
  }
}

export const medicineService = new MedicineService();
