import { jest } from "@jest/globals";
import { SORT_DIRECTIONS, SortOrders, SYSTEM_TYPE_NAMES } from "@petec/shared";
import { SystemTypesRepository } from "../../../src/repositories/admin/index.js";

type QueryMock<T> = {
  sort: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
  populate: jest.Mock;
  lean: jest.Mock;
  exec: jest.MockedFunction<() => Promise<T>>;
};

const createQueryMock = <T>(result: T): QueryMock<T> => {
  const query = {
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    populate: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn<() => Promise<T>>().mockResolvedValue(result),
  } as QueryMock<T>;

  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.populate.mockReturnValue(query);
  query.lean.mockReturnValue(query);

  return query;
};

const createModelMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
});

describe("SystemTypesRepository", () => {
  it("returns the mapped model for a known system type", () => {
    const repository = new SystemTypesRepository();

    const model = repository.getModel(SYSTEM_TYPE_NAMES.ANIMAL_TYPES);

    expect(model.modelName).toBe("AnimalType");
  });

  it("throws for an unknown system type", () => {
    const repository = new SystemTypesRepository();

    expect(() => repository.getModel("unknown" as never)).toThrow(
      "Unknown system type: unknown",
    );
  });

  it("finds active items with the shared not-deleted filter", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock([{ _id: "lookup-1" }]);
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.find.mockReturnValue(query);

    const result = await repository.findActive(SYSTEM_TYPE_NAMES.ANIMAL_TYPES);

    expect(model.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
    expect(query.sort).toHaveBeenCalledWith({ name: 1 });
    expect(result).toEqual([{ _id: "lookup-1" }]);
  });

  it("finds all items with the shared not-deleted filter", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock([{ _id: "lookup-2" }]);
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.find.mockReturnValue(query);

    await repository.findAll(SYSTEM_TYPE_NAMES.FOOD_TYPES);

    expect(model.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
    expect(query.sort).toHaveBeenCalledWith({ name: 1 });
  });

  it("finds one item by id while excluding deleted records", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock({ _id: "lookup-3" });
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.findOne.mockReturnValue(query);

    await repository.findById(SYSTEM_TYPE_NAMES.GENDER_TYPES, "lookup-3");

    expect(model.findOne).toHaveBeenCalledWith({
      $and: [{ isDeleted: { $ne: true } }, { _id: "lookup-3" }],
    });
  });

  it("finds by name including deleted values using an exact trimmed regex", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock({ _id: "lookup-4" });
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.findOne.mockReturnValue(query);

    await repository.findByNameIncludingDeleted(
      SYSTEM_TYPE_NAMES.INSURANCE_TYPES,
      "  Referral  ",
    );

    const filter = model.findOne.mock.calls[0][0] as { name: RegExp };
    expect(filter.name.source).toBe("^Referral$");
    expect(filter.name.flags).toContain("i");
  });

  it("finds by name including deleted values while excluding one id", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock({ _id: "lookup-5" });
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.findOne.mockReturnValue(query);

    await repository.findByNameIncludingDeletedExceptId(
      SYSTEM_TYPE_NAMES.EXAMINATION_TYPES,
      "Glucose",
      "lookup-5",
    );

    expect(model.findOne).toHaveBeenCalledWith({
      _id: { $ne: "lookup-5" },
      name: /^Glucose$/i,
    });
  });

  it("creates a new system type entry", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.create = jest.fn(async () => ({ _id: "lookup-6" }));

    const result = await repository.create(SYSTEM_TYPE_NAMES.FECES_TYPES, {
      name: "Normal",
    });

    expect(model.create).toHaveBeenCalledWith({ name: "Normal" });
    expect(result).toEqual({ _id: "lookup-6" });
  });

  it("updates an undeleted system type entry", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock({ _id: "lookup-7" });
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.findOneAndUpdate.mockReturnValue(query);

    await repository.update(SYSTEM_TYPE_NAMES.URINE_TYPES, "lookup-7", { name: "Updated" });

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      {
        $and: [{ isDeleted: { $ne: true } }, { _id: "lookup-7" }],
      },
      { $set: { name: "Updated" } },
      { returnDocument: "after" },
    );
  });

  it("soft deletes an undeleted system type entry", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock({ _id: "lookup-8" });
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.findOneAndUpdate.mockReturnValue(query);

    await repository.remove(SYSTEM_TYPE_NAMES.PROCEDURE_TYPES, "lookup-8");

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      {
        $and: [{ isDeleted: { $ne: true } }, { _id: "lookup-8" }],
      },
      { $set: { isDeleted: true } },
      { returnDocument: "after" },
    );
  });

  it("hard deletes a system type entry", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock({ _id: "lookup-9" });
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.findByIdAndDelete.mockReturnValue(query);

    await repository.hardDelete(SYSTEM_TYPE_NAMES.PATIENT_DOCUMENT_TYPES, "lookup-9");

    expect(model.findByIdAndDelete).toHaveBeenCalledWith("lookup-9");
  });

  it("finds items by animal type id", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock([{ _id: "lookup-10" }]);
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.find.mockReturnValue(query);

    await repository.findByAnimalTypeId(SYSTEM_TYPE_NAMES.RACE_TYPES, "animal-1");

    expect(model.find).toHaveBeenCalledWith({
      $and: [{ isDeleted: { $ne: true } }, { animalTypeId: "animal-1" }],
    });
    expect(query.sort).toHaveBeenCalledWith({ name: 1 });
  });

  it("counts documents with the not-deleted filter merged into the provided filter", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock(12);
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.countDocuments.mockReturnValue(query);

    const result = await repository.countDocuments(
      SYSTEM_TYPE_NAMES.MEDICINES,
      { categoryId: "category-1" } as never,
    );

    expect(model.countDocuments).toHaveBeenCalledWith({
      $and: [{ isDeleted: { $ne: true } }, { categoryId: "category-1" }],
    });
    expect(result).toBe(12);
  });

  it("finds a paginated page with ascending sorting and a single populate field", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock([{ _id: "lookup-11" }]);
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.find.mockReturnValue(query);

    const result = await repository.findPaginated(
      SYSTEM_TYPE_NAMES.MEDICINES,
      { categoryId: "category-2" } as never,
      2,
      5,
      "name",
      SortOrders.ASC,
      "categoryId",
    );

    expect(model.find).toHaveBeenCalledWith({
      $and: [{ isDeleted: { $ne: true } }, { categoryId: "category-2" }],
    });
    expect(query.sort).toHaveBeenCalledWith({ name: SORT_DIRECTIONS.ASC });
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(query.populate).toHaveBeenCalledWith("categoryId");
    expect(query.lean).toHaveBeenCalled();
    expect(result).toEqual([{ _id: "lookup-11" }]);
  });

  it("finds a paginated page with descending sorting and multiple populate fields", async () => {
    const repository = new SystemTypesRepository();
    const model = createModelMock();
    const query = createQueryMock([{ _id: "lookup-12" }]);
    jest.spyOn(repository, "getModel").mockReturnValue(model as never);
    model.find.mockReturnValue(query);

    await repository.findPaginated(
      SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
      {} as never,
      1,
      10,
      "updatedAt",
      SortOrders.DESC,
      ["animalTypeId", "createdBy"],
    );

    expect(model.find).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
    expect(query.sort).toHaveBeenCalledWith({ updatedAt: SORT_DIRECTIONS.DESC });
    expect(query.populate).toHaveBeenNthCalledWith(1, "animalTypeId");
    expect(query.populate).toHaveBeenNthCalledWith(2, "createdBy");
  });
});
