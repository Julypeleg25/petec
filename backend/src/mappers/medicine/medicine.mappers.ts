import type {
    MedicineLeanDoc,
    PopulatedRefDoc,
    SimpleTypeLeanDoc,
} from "@app-types/medicine.types";
import type { MedicineDTO, SimpleSystemTypeDTO } from "@petec/shared";

const toRefIdString = (value?: string | { toString(): string } | null): string =>
    value == null
        ? ""
        : typeof value === "string"
            ? value
            : value.toString();

const toReferenceId = (value?: PopulatedRefDoc | null): string =>
    value == null ? "" : toRefIdString(value._id);

export const toPopulatedReference = (
    value?: PopulatedRefDoc | null,
): MedicineDTO["measureUnitType"] | undefined => {
    if (value == null) {
        return undefined;
    }
    return {
        id: toReferenceId(value),
        name: typeof value.name === "string" ? value.name : "",
        description:
            typeof value.description === "string" ? value.description : null,
        serialId: typeof value.serialId === "string" ? value.serialId : undefined,
        isDeleted:
            typeof value.isDeleted === "boolean" ? value.isDeleted : undefined,
        type: typeof value.type === "string" ? value.type : undefined,
        createdAt:
            value.createdAt instanceof Date ? value.createdAt.toISOString() : undefined,
        updatedAt:
            value.updatedAt instanceof Date ? value.updatedAt.toISOString() : undefined,
    };
};

export const mapMedicineDocToDto = (doc: MedicineLeanDoc): MedicineDTO => ({
    id: toRefIdString(doc._id),
    name: doc.name,
    description: doc.description,
    isDeleted: doc.isDeleted,
    serialId: doc.serialId,
    measureUnitType: toPopulatedReference(doc.measureUnitTypeId),
    rangeMax: doc.rangeMax ?? undefined,
    rangeMin: doc.rangeMin ?? undefined,
    totalDose: doc.totalDose ?? undefined,
    comments: doc.comments,
    routeOfAdministration: toPopulatedReference(doc.routeOfAdministrationId),
    dosageFrequency: toPopulatedReference(doc.dosageFrequencyId),
    category: toPopulatedReference(doc.categoryId),
    defaultUnit: doc.defaultUnit ?? undefined,
});

export const mapSimpleTypeDocToDto = (
    doc: SimpleTypeLeanDoc,
): SimpleSystemTypeDTO => ({
    id: toRefIdString(doc._id),
    name: doc.name,
    description: doc.description,
    isDeleted: doc.isDeleted,
    serialId: doc.serialId,
});
