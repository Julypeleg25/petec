import { MEDICINE_CATEGORY_TYPES, SYSTEM_TYPE_NAMES } from "@petec/shared";
import { jest } from "@jest/globals";

const getModelMock = jest.fn<(...args: any[]) => any>();
const findActiveMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const mapMedicineDocToDtoMock = jest.fn<(doc: any) => any>();
const mapSimpleTypeDocToDtoMock = jest.fn<(doc: any) => any>();

jest.unstable_mockModule("../../../src/repositories/admin/index.js", () => ({
  systemTypesRepository: {
    getModel: getModelMock,
    findActive: findActiveMock,
  },
}));

jest.unstable_mockModule("../../../src/mappers/medicine/medicine.mappers.js", () => ({
  mapMedicineDocToDto: mapMedicineDocToDtoMock,
  mapSimpleTypeDocToDto: mapSimpleTypeDocToDtoMock,
}));

const { MedicineService } = await import("../../../src/services/medicine/medicineService.js");

const createQuery = (result: any) => ({
  populate: jest.fn(function mockPopulate(this: any) {
    return this;
  }),
  sort: jest.fn(function mockSort(this: any) {
    return this;
  }),
  lean: jest.fn(function mockLean(this: any) {
    return this;
  }),
  exec: jest.fn<() => Promise<any>>().mockResolvedValue(result),
});

const createModel = ({
  findResult = [],
  findOneResult = null,
}: {
  findResult?: unknown;
  findOneResult?: unknown;
}) => ({
  find: jest.fn().mockImplementation(() => createQuery(findResult)),
  findOne: jest.fn().mockImplementation(() => createQuery(findOneResult)),
});

describe("MedicineService", () => {
  const service = new MedicineService();

  beforeEach(() => {
    getModelMock.mockReset();
    findActiveMock.mockReset();
    mapMedicineDocToDtoMock.mockReset();
    mapSimpleTypeDocToDtoMock.mockReset();
  });

  it("loads active medicines with populated relations and maps them", async () => {
    const docs = [{ _id: "med-1" }, { _id: "med-2" }];
    const model = createModel({ findResult: docs });
    getModelMock.mockReturnValue(model);
    mapMedicineDocToDtoMock
      .mockReturnValueOnce({ id: "dto-1" })
      .mockReturnValueOnce({ id: "dto-2" });

    await expect(service.getAll()).resolves.toEqual([{ id: "dto-1" }, { id: "dto-2" }]);

    expect(getModelMock).toHaveBeenCalledWith(SYSTEM_TYPE_NAMES.MEDICINES);
    expect(model.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
    const query = model.find.mock.results[0]?.value as ReturnType<typeof createQuery>;
    expect(query.populate).toHaveBeenNthCalledWith(1, "categoryId");
    expect(query.populate).toHaveBeenNthCalledWith(2, "measureUnitTypeId");
    expect(query.populate).toHaveBeenNthCalledWith(3, "dosageFrequencyId");
    expect(query.populate).toHaveBeenNthCalledWith(4, "routeOfAdministrationId");
    expect(query.sort).toHaveBeenCalledWith({ name: 1 });
    expect(mapMedicineDocToDtoMock.mock.calls[0]?.[0]).toBe(docs[0]);
    expect(mapMedicineDocToDtoMock.mock.calls[1]?.[0]).toBe(docs[1]);
  });

  it("returns an empty list when a medicine category type is missing", async () => {
    const categoryModel = createModel({ findOneResult: null });
    getModelMock.mockReturnValue(categoryModel);

    await expect(
      service.getAllByCategoryType(MEDICINE_CATEGORY_TYPES.FLUID_EXTRA),
    ).resolves.toEqual([]);

    expect(getModelMock).toHaveBeenCalledTimes(1);
    expect(getModelMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES,
    );
    expect(categoryModel.findOne).toHaveBeenCalledWith({
      isDeleted: { $ne: true },
      type: MEDICINE_CATEGORY_TYPES.FLUID_EXTRA,
    });
    expect(mapMedicineDocToDtoMock).not.toHaveBeenCalled();
  });

  it("filters medicines by category type when the category exists", async () => {
    const category = { _id: "cat-1" };
    const categoryModel = createModel({ findOneResult: category });
    const medicineDocs = [{ _id: "med-1" }];
    const medicineModel = createModel({ findResult: medicineDocs });
    getModelMock
      .mockReturnValueOnce(categoryModel)
      .mockReturnValueOnce(medicineModel);
    mapMedicineDocToDtoMock.mockReturnValue({ id: "dto-1" });

    await expect(
      service.getAllByCategoryType(MEDICINE_CATEGORY_TYPES.MEDICINE),
    ).resolves.toEqual([{ id: "dto-1" }]);

    expect(getModelMock).toHaveBeenNthCalledWith(
      1,
      SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES,
    );
    expect(getModelMock).toHaveBeenNthCalledWith(2, SYSTEM_TYPE_NAMES.MEDICINES);
    expect(medicineModel.find).toHaveBeenCalledWith({
      isDeleted: { $ne: true },
      categoryId: "cat-1",
    });
    expect(mapMedicineDocToDtoMock.mock.calls[0]?.[0]).toBe(medicineDocs[0]);
  });

  it.each([
    ["getAllCategoryTypes", SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES],
    ["getMedicinesFrequencies", SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES],
    ["getMedicinesRoutesForAdministration", SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION],
    ["getMeasureUnitTypes", SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES],
  ] as const)(
    "%s loads active system types and maps plain DTOs",
    async (methodName, systemTypeName) => {
      const docs = [
        { toObject: jest.fn().mockReturnValue({ _id: "type-1" }) },
        { toObject: jest.fn().mockReturnValue({ _id: "type-2" }) },
      ];
      findActiveMock.mockResolvedValue(docs);
      mapSimpleTypeDocToDtoMock
        .mockReturnValueOnce({ id: "dto-1" })
        .mockReturnValueOnce({ id: "dto-2" });

      await expect(service[methodName]()).resolves.toEqual([
        { id: "dto-1" },
        { id: "dto-2" },
      ]);

      expect(findActiveMock).toHaveBeenCalledWith(systemTypeName);
      expect(docs[0].toObject).toHaveBeenCalled();
      expect(docs[1].toObject).toHaveBeenCalled();
      expect(mapSimpleTypeDocToDtoMock).toHaveBeenNthCalledWith(1, { _id: "type-1" });
      expect(mapSimpleTypeDocToDtoMock).toHaveBeenNthCalledWith(2, { _id: "type-2" });

      findActiveMock.mockReset();
      mapSimpleTypeDocToDtoMock.mockReset();
    },
  );
});
