import { jest } from "@jest/globals";
import { roles, UserStatus } from "@petec/shared";
import { Types } from "mongoose";
import { AuditRepository } from "../../../src/repositories/audit/index.js";
import { UserRepository } from "../../../src/repositories/user/index.js";

type QueryMock<T> = {
  select: jest.Mock;
  populate: jest.Mock;
  sort: jest.Mock;
  exec: jest.MockedFunction<() => Promise<T>>;
};

const createQueryMock = <T>(result: T): QueryMock<T> => {
  const query = {
    select: jest.fn(),
    populate: jest.fn(),
    sort: jest.fn(),
    exec: jest.fn<() => Promise<T>>().mockResolvedValue(result),
  } as QueryMock<T>;

  query.select.mockReturnValue(query);
  query.populate.mockReturnValue(query);
  query.sort.mockReturnValue(query);

  return query;
};

const attachModel = <T extends { model: unknown }>(repository: T, model: unknown): void => {
  (repository as { model: unknown }).model = model;
};

describe("UserRepository", () => {
  it("finds users by email and lowercases the lookup value", async () => {
    const repository = new UserRepository();
    const query = createQueryMock({ _id: "user-1" });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByEmail("Doctor@Clinic.COM");

    expect(model.findOne).toHaveBeenCalledWith({ email: "doctor@clinic.com" });
  });

  it("finds users by username", async () => {
    const repository = new UserRepository();
    const query = createQueryMock({ _id: "user-2" });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByUsername("nurse-a");

    expect(model.findOne).toHaveBeenCalledWith({ username: "nurse-a" });
  });

  it("finds a user by username with the password hash selected", async () => {
    const repository = new UserRepository();
    const query = createQueryMock({ _id: "user-3" });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByUsernameWithPassword("doctor-a");

    expect(query.select).toHaveBeenCalledWith("+passwordHash");
  });

  it("finds a user by email with the password hash selected", async () => {
    const repository = new UserRepository();
    const query = createQueryMock({ _id: "user-4" });
    const model = { findOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByEmailWithPassword("Tech@Clinic.COM");

    expect(model.findOne).toHaveBeenCalledWith({ email: "tech@clinic.com" });
    expect(query.select).toHaveBeenCalledWith("+passwordHash");
  });

  it("finds a user by id with refresh tokens selected", async () => {
    const repository = new UserRepository();
    const query = createQueryMock({ _id: "user-5" });
    const model = { findById: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByIdWithRefreshTokens("user-5");

    expect(model.findById).toHaveBeenCalledWith("user-5");
    expect(query.select).toHaveBeenCalledWith("+refreshTokens");
  });

  it("adds a refresh token", async () => {
    const repository = new UserRepository();
    const query = createQueryMock({ acknowledged: true });
    const model = { updateOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);
    const token = { tokenHash: "hash-1", expiresAt: new Date("2026-05-01T00:00:00.000Z") };

    await repository.addRefreshToken("user-6", token as never);

    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: "user-6" },
      { $push: { refreshTokens: token } },
    );
  });

  it("removes one refresh token", async () => {
    const repository = new UserRepository();
    const query = createQueryMock({ acknowledged: true });
    const model = { updateOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.removeRefreshToken("user-7", "hash-2");

    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: "user-7" },
      { $pull: { refreshTokens: { tokenHash: "hash-2" } } },
    );
  });

  it("removes all refresh tokens", async () => {
    const repository = new UserRepository();
    const query = createQueryMock({ acknowledged: true });
    const model = { updateOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.removeAllRefreshTokens("user-8");

    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: "user-8" },
      { $set: { refreshTokens: [] } },
    );
  });

  it("updates the last login timestamp", async () => {
    const repository = new UserRepository();
    const query = createQueryMock({ acknowledged: true });
    const model = { updateOne: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.updateLastLogin("user-9");

    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: "user-9" },
      { $set: { lastLogin: expect.any(Date) } },
    );
  });

  it("finds active, non-deleted users by role", async () => {
    const repository = new UserRepository();
    const query = createQueryMock([{ _id: "user-10" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByRole(roles.DOCTOR);

    expect(model.find).toHaveBeenCalledWith({
      role: roles.DOCTOR,
      status: UserStatus.ACTIVE,
      isDeleted: { $ne: true },
    });
  });
});

describe("AuditRepository", () => {
  it("finds audit logs by entity id with population and descending creation order", async () => {
    const repository = new AuditRepository();
    const query = createQueryMock([{ _id: "audit-1" }]);
    const model = { find: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    await repository.findByEntityId("case", "case-50");

    expect(model.find).toHaveBeenCalledWith({ entityType: "case", entityId: "case-50" });
    expect(query.populate).toHaveBeenCalledWith("performedByUserId", "email role");
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("returns the deleted count when removing audit logs by entity id", async () => {
    const repository = new AuditRepository();
    const query = createQueryMock({ deletedCount: 6 });
    const model = { deleteMany: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    const result = await repository.deleteAllByEntityId("patient", "patient-1");

    expect(model.deleteMany).toHaveBeenCalledWith({ entityType: "patient", entityId: "patient-1" });
    expect(result).toBe(6);
  });

  it("returns zero when deleting audit logs reports no deleted count", async () => {
    const repository = new AuditRepository();
    const query = createQueryMock({});
    const model = { deleteMany: jest.fn().mockReturnValue(query) };
    attachModel(repository as never, model);

    const result = await repository.deleteAllByEntityId("patient", "patient-2");

    expect(result).toBe(0);
  });

  it("logs an audit entry without a performer id", async () => {
    const repository = new AuditRepository();
    const createdDoc = { _id: "audit-2" };
    const model = { create: jest.fn(async () => [createdDoc]) };
    attachModel(repository as never, model);
    const session = { id: "session-1" };

    const result = await repository.log(
      "Created",
      "Created the case",
      "case",
      "case-60",
      undefined,
      session as never,
    );

    expect(model.create).toHaveBeenCalledWith(
      [
        {
          subject: "Created",
          description: "Created the case",
          entityType: "case",
          entityId: "case-60",
        },
      ],
      { session },
    );
    expect(result).toEqual(createdDoc);
  });

  it("converts a string performer id into an ObjectId when logging", async () => {
    const repository = new AuditRepository();
    const createdDoc = { _id: "audit-3" };
    const model = { create: jest.fn(async () => [createdDoc]) };
    attachModel(repository as never, model);
    const performerId = new Types.ObjectId().toHexString();

    await repository.log("Updated", "Updated the case", "case", "case-61", performerId);

    const payload = ((model.create as jest.Mock).mock.calls[0][0] as Array<{
      performedByUserId: Types.ObjectId;
    }>)[0];
    expect(payload.performedByUserId).toBeInstanceOf(Types.ObjectId);
    expect(payload.performedByUserId.toHexString()).toBe(performerId);
  });

  it("keeps an existing ObjectId performer id when logging", async () => {
    const repository = new AuditRepository();
    const createdDoc = { _id: "audit-4" };
    const model = { create: jest.fn(async () => [createdDoc]) };
    attachModel(repository as never, model);
    const performerId = new Types.ObjectId();

    await repository.log("Archived", "Archived the case", "case", "case-62", performerId);

    const payload = ((model.create as jest.Mock).mock.calls[0][0] as Array<{
      performedByUserId: Types.ObjectId;
    }>)[0];
    expect(payload.performedByUserId).toBe(performerId);
  });
});
