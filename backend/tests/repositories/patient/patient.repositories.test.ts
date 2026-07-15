import { jest } from "@jest/globals";
import {
  AnesthesiaFormRepository,
  CaseRepository,
  DocumentRepository,
  MasterCaseRepository,
  PatientMedicineRepository,
  PatientRepository,
} from "../../../src/repositories/patient/index.js";

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

const attachModel = <T extends { model: unknown }>(repository: T, model: unknown): void => {
  (repository as { model: unknown }).model = model;
};

describe("PatientRepository", () => {
  it("searches by patient name with a token lookahead regex", async () => {
    const repository = new PatientRepository();
    const query = createQueryMock([{ _id: "patient-1" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    const result = await repository.searchByName("spot buddy", 5);

    const filter = model.find.mock.calls[0][0] as { name: RegExp };
    expect(filter.name.source).toBe("(?=.*spot)(?=.*buddy).*");
    expect(filter.name.flags).toContain("i");
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(query.sort).toHaveBeenCalledWith({ updatedAt: -1 });
    expect(result).toEqual([{ _id: "patient-1" }]);
  });

  it("searches by owner name and falls back to a match-all regex for blank input", async () => {
    const repository = new PatientRepository();
    const query = createQueryMock([{ _id: "patient-2" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.searchByOwnerName("   ");

    const filter = model.find.mock.calls[0][0] as { "owner.name": RegExp };
    expect(filter["owner.name"].source).toBe(".*");
    expect(filter["owner.name"].flags).toContain("i");
  });

  it("searches by owner phone with a flexible digit regex", async () => {
    const repository = new PatientRepository();
    const query = createQueryMock([{ _id: "patient-3" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.searchByOwnerPhone("(050) 12-34");

    const filter = model.find.mock.calls[0][0] as { "owner.phone": RegExp };
    expect(filter["owner.phone"].source).toContain("\\D*");
    expect(filter["owner.phone"].source).toContain("0");
    expect(query.sort).toHaveBeenCalledWith({ updatedAt: -1 });
  });

  it("searches by owner phone with text matching when no digits exist", async () => {
    const repository = new PatientRepository();
    const query = createQueryMock([{ _id: "patient-4" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.searchByOwnerPhone("owner name");

    const filter = model.find.mock.calls[0][0] as { "owner.phone": RegExp };
    expect(filter["owner.phone"].source).toBe("(?=.*owner)(?=.*name).*");
  });

  it("collects patient ids from matching search results", async () => {
    const repository = new PatientRepository();
    const query = createQueryMock([
      { _id: "patient-4" },
      { _id: null },
      {},
      { _id: "patient-5" },
    ]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    const result = await repository.searchCasePatientIds("050-12", 7);

    const filter = model.find.mock.calls[0][0] as { $or: Array<Record<string, RegExp>> };
    expect(filter.$or).toHaveLength(3);
    expect(filter.$or[0].name).toBeInstanceOf(RegExp);
    expect(filter.$or[2]["owner.phone"].source).toContain("\\D*");
    expect(query.limit).toHaveBeenCalledWith(7);
    expect(query.select).toHaveBeenCalledWith("_id");
    expect(query.lean).toHaveBeenCalled();
    expect(result).toEqual(["patient-4", "patient-5"]);
  });
});

describe("CaseRepository", () => {
  it("finds active cases for a patient with newest-first ordering and an optional session", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock([{ _id: "case-1" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const session = { id: "session-1" };

    const result = await repository.findByPatientId("patient-1", { session } as never);

    expect(model.find).toHaveBeenCalledWith({ patientId: "patient-1", isDeleted: false });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual([{ _id: "case-1" }]);
  });

  it("finds the current active case for a patient", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock({ _id: "case-2" });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findActiveByPatientId("patient-2");

    expect(model.findOne).toHaveBeenCalledWith({
      patientId: "patient-2",
      isDeleted: false,
      isArchived: false,
      releaseDate: { $exists: false },
    });
  });

  it("finds a populated case by id", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock({ _id: "case-3" });
    const model = { findById: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    const result = await repository.findByIdPopulated("case-3");

    expect(model.findById).toHaveBeenCalledWith("case-3");
    expect(query.populate).toHaveBeenCalledTimes(22);
    expect(query.populate).toHaveBeenNthCalledWith(1, "patientId");
    expect(query.populate).toHaveBeenNthCalledWith(
      22,
      "caseDetailsGrid.fecesTypeId",
      "_id name",
    );
    expect(result).toEqual({ _id: "case-3" });
  });

  it("finds a case by serial id with an optional session", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock({ _id: "case-4" });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const session = { id: "session-2" };

    await repository.findBySerialId("SER-001", { session } as never);

    expect(model.findOne).toHaveBeenCalledWith({ serialId: "SER-001" });
    expect(query.session).toHaveBeenCalledWith(session);
  });

  it("finds a populated case by serial id", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock({ _id: "case-5" });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findBySerialIdPopulated("SER-002");

    expect(query.populate).toHaveBeenCalledTimes(22);
    expect(query.populate).toHaveBeenNthCalledWith(
      2,
      "doctorUserId",
      "email role firstName lastName",
    );
  });

  it("finds the latest case for a serial prefix using an escaped regex", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock({ _id: "case-6" });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findLatestBySerialPrefix("A+B");

    const filter = model.findOne.mock.calls[0][0] as { serialId: RegExp };
    expect(filter.serialId.source).toBe("^A\\+B(?:-[\\d-]+)?$");
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("finds cases for a serial prefix and excludes deleted cases", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock([{ _id: "case-7" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const session = { id: "session-3" };

    await repository.findBySerialPrefix("PX-1", { session } as never);

    const filter = model.find.mock.calls[0][0] as { serialId: RegExp; isDeleted: boolean };
    expect(filter.serialId).toBeInstanceOf(RegExp);
    expect(filter.isDeleted).toBe(false);
    expect(query.session).toHaveBeenCalledWith(session);
  });

  it("assigns a master case id to all cases sharing a serial prefix", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock({ acknowledged: true });
    const model = { updateMany: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const session = { id: "session-4" };

    await repository.assignMasterCaseBySerialPrefix("PX-2", "master-1", { session } as never);

    const filter = model.updateMany.mock.calls[0][0] as { serialId: RegExp };
    expect(filter.serialId).toBeInstanceOf(RegExp);
    expect(model.updateMany).toHaveBeenCalledWith(
      filter,
      { $set: { masterCaseId: "master-1" } },
    );
    expect(query.session).toHaveBeenCalledWith(session);
  });

  it("delegates case details grid updates to the shared repository helpers", async () => {
    const repository = new CaseRepository();
    const updateByIdSpy = jest.spyOn(repository, "updateById").mockResolvedValue({ _id: "case-8" } as never);
    const updateOneSpy = jest.spyOn(repository, "updateOne").mockResolvedValue({ _id: "case-9" } as never);
    const grid = [{ index: 0 }] as never;
    const session = { id: "session-5" };

    await repository.updateCaseDetailsGrid("case-8", grid);
    await repository.updateCaseDetailsGridBySerialId("SER-003", grid, session as never);

    expect(updateByIdSpy).toHaveBeenCalledWith("case-8", { $set: { caseDetailsGrid: grid } });
    expect(updateOneSpy).toHaveBeenCalledWith(
      { serialId: "SER-003" },
      { $set: { caseDetailsGrid: grid } },
      { session },
    );
  });

  it("delegates soft delete and archive updates", async () => {
    const repository = new CaseRepository();
    const updateByIdSpy = jest.spyOn(repository, "updateById").mockResolvedValue({ _id: "case-10" } as never);
    const session = { id: "session-6" };

    await repository.softDelete("case-10", { session } as never);
    await repository.archive("case-11", false, { session } as never);

    expect(updateByIdSpy).toHaveBeenNthCalledWith(
      1,
      "case-10",
      { $set: { isDeleted: true } },
      { session },
    );
    expect(updateByIdSpy).toHaveBeenNthCalledWith(
      2,
      "case-11",
      { $set: { isArchived: false } },
      { session },
    );
  });

  it("does not unarchive procedures when the target date cannot be normalized", async () => {
    const repository = new CaseRepository();
    const model = { updateMany: jest.fn() };
    attachModel(repository as never, model);

    const result = await repository.unarchiveProceduresScheduledForDate(new Date(Number.NaN));

    expect(model.updateMany).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it("unarchives matching procedure cases for a normalized Jerusalem date", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock({ modifiedCount: 3 });
    const model = { updateMany: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const targetDate = new Date("2026-04-21T08:00:00.000Z");

    const result = await repository.unarchiveProceduresScheduledForDate(targetDate);

    expect(model.updateMany).toHaveBeenCalled();
    const filter = model.updateMany.mock.calls[0][0] as Record<string, unknown>;
    expect(filter.isArchived).toBe(true);
    expect(filter.isDeleted).toBe(false);
    expect(filter["flags.isProcedure"]).toBe(true);
    expect(query.exec).toHaveBeenCalled();
    expect(result).toBe(3);
  });

  it("archives active procedure cases scheduled before a normalized Jerusalem date", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock({ modifiedCount: 2 });
    const model = { updateMany: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const targetDate = new Date("2026-04-21T08:00:00.000Z");

    const result = await repository.archiveProceduresScheduledBeforeDate(targetDate);

    expect(model.updateMany).toHaveBeenCalled();
    const [filter, update] = model.updateMany.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(filter.isArchived).toBe(false);
    expect(filter.isDeleted).toBe(false);
    expect(filter["flags.isProcedure"]).toBe(true);
    expect(filter["caseDetailsGrid.dateTime"]).toEqual({
      $not: { $gte: new Date("2026-04-21T00:00:00.000Z") },
    });
    expect(update).toEqual({
      $set: { isArchived: true, isManuallyUnarchived: false },
    });
    expect(query.exec).toHaveBeenCalled();
    expect(result).toBe(2);
  });

  it("does not archive past procedures when the target date cannot be normalized", async () => {
    const repository = new CaseRepository();
    const model = { updateMany: jest.fn() };
    attachModel(repository as never, model);

    const result = await repository.archiveProceduresScheduledBeforeDate(
      new Date(Number.NaN),
    );

    expect(model.updateMany).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it("unarchives procedure cases that have case details on or after the target date", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock({ modifiedCount: 5 });
    const model = { updateMany: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const targetDate = new Date("2026-04-21T08:00:00.000Z");

    const result =
      await repository.unarchiveProceduresWithCaseDetailsOnOrAfterDate(targetDate);

    expect(model.updateMany).toHaveBeenCalledWith(
      {
        isArchived: true,
        isDeleted: false,
        "flags.isProcedure": true,
        "caseDetailsGrid.dateTime": {
          $gte: new Date("2026-04-21T00:00:00.000Z"),
        },
      },
      { $set: { isArchived: false, isManuallyUnarchived: false } },
    );
    expect(query.exec).toHaveBeenCalled();
    expect(result).toBe(5);
  });

  it("releases a case and includes updated dates when provided", async () => {
    const repository = new CaseRepository();
    const updateByIdSpy = jest.spyOn(repository, "updateById").mockResolvedValue({ _id: "case-12" } as never);
    const session = { id: "session-7" };
    const dates = { procedureDate: new Date("2026-04-22T10:00:00.000Z") };

    await repository.release("case-12", "user-1", { dates } as never, session as never);

    expect(updateByIdSpy).toHaveBeenCalledWith(
      "case-12",
      {
        $set: {
          releaseDate: expect.any(Date),
          releasedByUserId: "user-1",
          dates,
        },
      },
      { session },
    );
  });

  it("releases a case without injecting dates when no date updates were supplied", async () => {
    const repository = new CaseRepository();
    const updateByIdSpy = jest.spyOn(repository, "updateById").mockResolvedValue({ _id: "case-13" } as never);

    await repository.release("case-13", "user-2", {});

    expect(updateByIdSpy).toHaveBeenCalledWith(
      "case-13",
      {
        $set: {
          releaseDate: expect.any(Date),
          releasedByUserId: "user-2",
        },
      },
      { session: undefined },
    );
  });

  it("finds cases by master case id and excludes deleted cases", async () => {
    const repository = new CaseRepository();
    const query = createQueryMock([{ _id: "case-14" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByMasterCaseId("master-2");

    expect(model.find).toHaveBeenCalledWith({ masterCaseId: "master-2", isDeleted: false });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });
});

describe("DocumentRepository", () => {
  it("finds documents by patient id with population and an optional session", async () => {
    const repository = new DocumentRepository();
    const query = createQueryMock([{ _id: "doc-1" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const session = { id: "session-8" };

    await repository.findByPatientId("patient-10", { session } as never);

    expect(model.find).toHaveBeenCalledWith({ patientId: "patient-10" });
    expect(query.populate).toHaveBeenCalledWith("patientDocumentTypeId", "name");
    expect(query.sort).toHaveBeenCalledWith({ uploadedAt: -1 });
    expect(query.session).toHaveBeenCalledWith(session);
  });

  it("finds documents by case id", async () => {
    const repository = new DocumentRepository();
    const query = createQueryMock([{ _id: "doc-2" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    const session = { id: "session-doc-case" };

    await repository.findByCaseId("case-20", { session } as never);

    expect(model.find).toHaveBeenCalledWith({ caseId: "case-20" });
    expect(query.populate).toHaveBeenCalledWith("patientDocumentTypeId", "name");
    expect(query.session).toHaveBeenCalledWith(session);
  });
});

describe("PatientMedicineRepository", () => {
  it("finds active patient medicines with nested population", async () => {
    const repository = new PatientMedicineRepository();
    const query = createQueryMock([{ _id: "med-1" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByCaseId("case-30");

    expect(model.find).toHaveBeenCalledWith({ caseId: "case-30", isDeleted: { $ne: true } });
    expect(query.populate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        path: "medicineId",
        select: "name rangeMin rangeMax totalDose comments measureUnitTypeId",
      }),
    );
    expect(query.populate).toHaveBeenNthCalledWith(2, "dosageFrequencyId", "name");
    expect(query.populate).toHaveBeenNthCalledWith(3, "routeOfAdministrationId", "name");
    expect(query.populate).toHaveBeenNthCalledWith(4, "measureUnitTypeId", "name");
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });
});

describe("MasterCaseRepository", () => {
  it("adds a case id to a master case with an optional session", async () => {
    const repository = new MasterCaseRepository();
    const query = createQueryMock({ acknowledged: true });
    const model = { updateOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const session = { id: "session-9" };

    await repository.addCaseId("master-3", "case-31", { session } as never);

    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: "master-3" },
      { $addToSet: { caseIds: "case-31" } },
    );
    expect(query.session).toHaveBeenCalledWith(session);
  });

  it("removes a case id from a master case", async () => {
    const repository = new MasterCaseRepository();
    const query = createQueryMock({ acknowledged: true });
    const model = { updateOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    const session = { id: "session-master-remove" };

    await repository.removeCaseId("master-4", "case-32", { session } as never);

    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: "master-4" },
      { $pull: { caseIds: "case-32" } },
    );
    expect(query.session).toHaveBeenCalledWith(session);
  });
});

describe("AnesthesiaFormRepository", () => {
  it("finds an anesthesia form by case id", async () => {
    const repository = new AnesthesiaFormRepository();
    const query = createQueryMock({ _id: "form-1" });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByCaseId("case-40");

    expect(model.findOne).toHaveBeenCalledWith({ caseId: "case-40" });
  });

  it("upserts an anesthesia form by case id", async () => {
    const repository = new AnesthesiaFormRepository();
    const query = createQueryMock({ _id: "form-2" });
    const model = { findOneAndUpdate: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const session = { id: "session-10" };

    const result = await repository.upsertByCaseId(
      "case-41",
      { ownerName: "Dana" } as never,
      session as never,
    );

    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { caseId: "case-41" },
      { $set: { ownerName: "Dana", caseId: "case-41" } },
      { upsert: true, returnDocument: "after", session },
    );
    expect(result).toEqual({ _id: "form-2" });
  });
});
