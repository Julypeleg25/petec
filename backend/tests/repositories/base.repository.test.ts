import { jest } from "@jest/globals";
import { BaseRepository } from "../../src/repositories/base.repository.js";

type TestEntity = {
  _id?: string;
  name?: string;
};

type QueryMock<T> = {
  session: jest.Mock;
  sort: jest.Mock;
  skip: jest.Mock;
  limit: jest.Mock;
  select: jest.Mock;
  populate: jest.Mock;
  lean: jest.Mock;
  exec: jest.MockedFunction<() => Promise<T>>;
};

const createQueryMock = <T>(result: T): QueryMock<T> => {
  const query = {
    session: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
    populate: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn<() => Promise<T>>().mockResolvedValue(result),
  } as QueryMock<T>;

  query.session.mockReturnValue(query);
  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.populate.mockReturnValue(query);
  query.lean.mockReturnValue(query);

  return query;
};

const createModelMock = () => {
  const save = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const model = jest.fn().mockImplementation(function Model(
    this: { payload?: unknown; save?: typeof save },
    data: unknown,
  ) {
    this.payload = data;
    this.save = save;
  }) as jest.Mock & Record<string, jest.Mock>;

  model.findById = jest.fn();
  model.findOne = jest.fn();
  model.find = jest.fn();
  model.countDocuments = jest.fn();
  model.findByIdAndUpdate = jest.fn();
  model.findOneAndUpdate = jest.fn();
  model.findByIdAndDelete = jest.fn();
  model.deleteMany = jest.fn();
  model.exists = jest.fn();

  return { model, save };
};

describe("BaseRepository", () => {
  it("creates a document without a session", async () => {
    const { model, save } = createModelMock();
    const repository = new BaseRepository<TestEntity>(model as never);

    const doc = await repository.create({ name: "Lucky" });

    expect(model).toHaveBeenCalledWith({ name: "Lucky" });
    expect(save).toHaveBeenCalledWith(undefined);
    expect((doc as unknown as { payload: TestEntity }).payload).toEqual({ name: "Lucky" });
  });

  it("creates a document with a session", async () => {
    const { model, save } = createModelMock();
    const repository = new BaseRepository<TestEntity>(model as never);
    const session = { id: "session-1" };

    await repository.create({ name: "Lucky" }, { session } as never);

    expect(save).toHaveBeenCalledWith({ session });
  });

  it("finds by id and attaches the session when provided", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<TestEntity | null>({ _id: "patient-1" });
    const repository = new BaseRepository<TestEntity>(model as never);
    const session = { id: "session-2" };
    model.findById.mockReturnValue(query);

    const result = await repository.findById("patient-1", { session } as never);

    expect(model.findById).toHaveBeenCalledWith("patient-1");
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual({ _id: "patient-1" });
  });

  it("finds one document without attaching a session when none is provided", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<TestEntity | null>({ name: "Bella" });
    const repository = new BaseRepository<TestEntity>(model as never);
    model.findOne.mockReturnValue(query);

    const result = await repository.findOne({ name: "Bella" } as never);

    expect(model.findOne).toHaveBeenCalledWith({ name: "Bella" });
    expect(query.session).not.toHaveBeenCalled();
    expect(result).toEqual({ name: "Bella" });
  });

  it("finds one document with a session when provided", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<TestEntity | null>({ name: "Bella" });
    const repository = new BaseRepository<TestEntity>(model as never);
    const session = { id: "session-find-one" };
    model.findOne.mockReturnValue(query);

    await repository.findOne({ name: "Bella" } as never, { session } as never);

    expect(query.session).toHaveBeenCalledWith(session);
  });

  it("finds many documents with sort, paging, selection, and multiple populate fields", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<TestEntity[]>([{ _id: "patient-2" }]);
    const repository = new BaseRepository<TestEntity>(model as never);
    model.find.mockReturnValue(query);

    const result = await repository.findMany(
      { name: "Max" } as never,
      {
        sort: { createdAt: -1 },
        skip: 5,
        limit: 10,
        select: "name owner",
        populate: ["owner", "doctor"],
      },
    );

    expect(model.find).toHaveBeenCalledWith({ name: "Max" });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.select).toHaveBeenCalledWith("name owner");
    expect(query.populate).toHaveBeenNthCalledWith(1, "owner");
    expect(query.populate).toHaveBeenNthCalledWith(2, "doctor");
    expect(result).toEqual([{ _id: "patient-2" }]);
  });

  it("finds many lean documents with a single populate field", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<TestEntity[]>([{ name: "Charlie" }]);
    const repository = new BaseRepository<TestEntity>(model as never);
    model.find.mockReturnValue(query);

    const result = await repository.findManyLean(
      { name: "Charlie" } as never,
      {
        sort: { updatedAt: -1 },
        skip: 1,
        limit: 2,
        select: "name",
        populate: "owner",
      },
    );

    expect(query.sort).toHaveBeenCalledWith({ updatedAt: -1 });
    expect(query.skip).toHaveBeenCalledWith(1);
    expect(query.limit).toHaveBeenCalledWith(2);
    expect(query.select).toHaveBeenCalledWith("name");
    expect(query.populate).toHaveBeenCalledWith("owner");
    expect(query.lean).toHaveBeenCalled();
    expect(result).toEqual([{ name: "Charlie" }]);
  });

  it("counts documents for a filter", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<number>(7);
    const repository = new BaseRepository<TestEntity>(model as never);
    model.countDocuments.mockReturnValue(query);

    const result = await repository.countDocuments({ archived: false } as never);

    expect(model.countDocuments).toHaveBeenCalledWith({ archived: false });
    expect(result).toBe(7);
  });

  it("updates by id and attaches the session when provided", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<TestEntity | null>({ _id: "patient-3", name: "Nina" });
    const repository = new BaseRepository<TestEntity>(model as never);
    const session = { id: "session-3" };
    model.findByIdAndUpdate.mockReturnValue(query);

    const result = await repository.updateById(
      "patient-3",
      { $set: { name: "Nina" } } as never,
      { session } as never,
    );

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      "patient-3",
      { $set: { name: "Nina" } },
      { returnDocument: "after" },
    );
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual({ _id: "patient-3", name: "Nina" });
  });

  it("updates one matching document", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<TestEntity | null>({ _id: "patient-4" });
    const repository = new BaseRepository<TestEntity>(model as never);
    model.findOneAndUpdate.mockReturnValue(query);

    const result = await repository.updateOne(
      { name: "Milo" } as never,
      { $set: { name: "Milo II" } } as never,
    );

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { name: "Milo" },
      { $set: { name: "Milo II" } },
      { returnDocument: "after" },
    );
    expect(result).toEqual({ _id: "patient-4" });
  });

  it("updates one matching document with a session", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<TestEntity | null>({ _id: "patient-4" });
    const repository = new BaseRepository<TestEntity>(model as never);
    const session = { id: "session-update-one" };
    model.findOneAndUpdate.mockReturnValue(query);

    await repository.updateOne(
      { name: "Milo" } as never,
      { $set: { name: "Milo II" } } as never,
      { session } as never,
    );

    expect(query.session).toHaveBeenCalledWith(session);
  });

  it("deletes by id and supports a session", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<TestEntity | null>({ _id: "patient-5" });
    const repository = new BaseRepository<TestEntity>(model as never);
    const session = { id: "session-4" };
    model.findByIdAndDelete.mockReturnValue(query);

    const result = await repository.deleteById("patient-5", { session } as never);

    expect(model.findByIdAndDelete).toHaveBeenCalledWith("patient-5");
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toEqual({ _id: "patient-5" });
  });

  it("deletes many documents and returns the deleted count", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<{ deletedCount?: number }>({ deletedCount: 4 });
    const repository = new BaseRepository<TestEntity>(model as never);
    const session = { id: "session-5" };
    model.deleteMany.mockReturnValue(query);

    const result = await repository.deleteMany({ isDeleted: true } as never, { session } as never);

    expect(model.deleteMany).toHaveBeenCalledWith({ isDeleted: true });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(result).toBe(4);
  });

  it("returns zero when deleteMany does not report a deleted count", async () => {
    const { model } = createModelMock();
    const query = createQueryMock<{ deletedCount?: number }>({});
    const repository = new BaseRepository<TestEntity>(model as never);
    model.deleteMany.mockReturnValue(query);

    const result = await repository.deleteMany({} as never);

    expect(result).toBe(0);
  });

  it("returns whether a matching document exists", async () => {
    const { model } = createModelMock();
    const existsQuery = createQueryMock<Record<string, unknown> | null>({ _id: "patient-6" });
    const missingQuery = createQueryMock<Record<string, unknown> | null>(null);
    const repository = new BaseRepository<TestEntity>(model as never);
    model.exists.mockReturnValueOnce(existsQuery).mockReturnValueOnce(missingQuery);

    await expect(repository.exists({ name: "Daisy" } as never)).resolves.toBe(true);
    await expect(repository.exists({ name: "Ghost" } as never)).resolves.toBe(false);
  });
});
