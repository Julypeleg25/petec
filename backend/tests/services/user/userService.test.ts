import { roles } from "@petec/shared";
import { jest } from "@jest/globals";
import { NotFoundError } from "../../../src/constants/error.constants.js";

const findManyMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const findByRoleMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const findByIdMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const updateByIdMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const auditLogMock = jest.fn<(...args: any[]) => Promise<void>>();
const infoMock = jest.fn<(...args: any[]) => void>();
const mapUserToRowMock = jest.fn<(doc: any) => any>();
const mapUserToResponseMock = jest.fn<(doc: any) => any>();
const mapUserToStaffMemberMock = jest.fn<(doc: any) => any>();

jest.unstable_mockModule("../../../src/repositories/user/index.js", () => ({
  userRepository: {
    findMany: findManyMock,
    findByRole: findByRoleMock,
    findById: findByIdMock,
    updateById: updateByIdMock,
  },
}));

jest.unstable_mockModule("../../../src/repositories/audit/index.js", () => ({
  auditRepository: {
    log: auditLogMock,
  },
}));

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
  },
}));

jest.unstable_mockModule("../../../src/mappers/user/user.mappers.js", () => ({
  mapUserToRow: mapUserToRowMock,
  mapUserToResponse: mapUserToResponseMock,
  mapUserToStaffMember: mapUserToStaffMemberMock,
}));

const { UserService } = await import("../../../src/services/user/userService.js");

describe("UserService", () => {
  const service = new UserService();

  beforeEach(() => {
    findManyMock.mockReset();
    findByRoleMock.mockReset();
    findByIdMock.mockReset();
    updateByIdMock.mockReset();
    auditLogMock.mockReset();
    infoMock.mockReset();
    mapUserToRowMock.mockReset();
    mapUserToResponseMock.mockReset();
    mapUserToStaffMemberMock.mockReset();
  });

  it("loads active users sorted by email and maps rows", async () => {
    const userA = { _id: "user-1", email: "amy@example.com" };
    const userB = { _id: "user-2", email: "zoe@example.com" };

    findManyMock.mockResolvedValue([userA, userB]);
    mapUserToRowMock
      .mockReturnValueOnce({ id: "row-1" })
      .mockReturnValueOnce({ id: "row-2" });

    await expect(service.getAllUsers()).resolves.toEqual([
      { id: "row-1" },
      { id: "row-2" },
    ]);

    expect(findManyMock).toHaveBeenCalledWith(
      { isDeleted: { $ne: true } },
      { sort: { email: 1 } },
    );
    expect(mapUserToRowMock).toHaveBeenCalledTimes(2);
    expect(mapUserToRowMock.mock.calls[0]?.[0]).toBe(userA);
    expect(mapUserToRowMock.mock.calls[1]?.[0]).toBe(userB);
  });

  it.each([
    ["getDoctors", roles.DOCTOR],
    ["getNurses", roles.ASSISTANT],
  ] as const)(
    "%s loads staff by role and maps the response",
    async (methodName, role) => {
      const docs = [{ _id: "user-1" }, { _id: "user-2" }];
      findByRoleMock.mockResolvedValue(docs);
      mapUserToStaffMemberMock
        .mockReturnValueOnce({ id: "staff-1" })
        .mockReturnValueOnce({ id: "staff-2" });

      await expect(service[methodName]()).resolves.toEqual([
        { id: "staff-1" },
        { id: "staff-2" },
      ]);

      expect(findByRoleMock).toHaveBeenCalledWith(role);
      expect(mapUserToStaffMemberMock).toHaveBeenCalledTimes(2);
      expect(mapUserToStaffMemberMock.mock.calls[0]?.[0]).toBe(docs[0]);
      expect(mapUserToStaffMemberMock.mock.calls[1]?.[0]).toBe(docs[1]);
    },
  );

  it("returns a mapped user when found by id", async () => {
    const user = { _id: "user-1", email: "amy@example.com" };
    findByIdMock.mockResolvedValue(user);
    mapUserToResponseMock.mockReturnValue({ id: "user-1" });

    await expect(service.getUserById("user-1")).resolves.toEqual({ id: "user-1" });

    expect(findByIdMock).toHaveBeenCalledWith("user-1");
    expect(mapUserToResponseMock).toHaveBeenCalledWith(user);
  });

  it("returns null when a user is not found by id", async () => {
    findByIdMock.mockResolvedValue(null);

    await expect(service.getUserById("missing")).resolves.toBeNull();

    expect(mapUserToResponseMock).not.toHaveBeenCalled();
  });

  it("updates a user, writes an audit log, and returns the mapped response", async () => {
    const user = { _id: "user-1", email: "amy@example.com" };
    const payload = { firstName: "Amelia" };

    updateByIdMock.mockResolvedValue(user);
    mapUserToResponseMock.mockReturnValue({ id: "user-1", firstName: "Amelia" });

    await expect(service.updateUser("user-1", payload)).resolves.toEqual({
      id: "user-1",
      firstName: "Amelia",
    });

    expect(updateByIdMock).toHaveBeenCalledWith("user-1", { $set: payload });
    expect(auditLogMock).toHaveBeenCalledWith(
      "User Management",
      "User updated: amy@example.com",
      "User",
      "user-1",
      "user-1",
    );
    expect(infoMock).toHaveBeenCalledWith("User updated", {
      module: "user",
      user_id: "user-1",
    });
    expect(mapUserToResponseMock).toHaveBeenCalledWith(user);
  });

  it("throws when updating a missing user", async () => {
    updateByIdMock.mockResolvedValue(null);

    await expect(service.updateUser("missing", { firstName: "Amelia" })).rejects.toThrow(
      NotFoundError,
    );

    expect(auditLogMock).not.toHaveBeenCalled();
    expect(infoMock).not.toHaveBeenCalled();
    expect(mapUserToResponseMock).not.toHaveBeenCalled();
  });

  it("soft deletes a user and records the audit trail", async () => {
    updateByIdMock.mockResolvedValue({ _id: "user-1", email: "amy@example.com" });

    await expect(service.deleteUser("user-1")).resolves.toBeUndefined();

    expect(updateByIdMock).toHaveBeenCalledWith("user-1", {
      $set: { isDeleted: true },
    });
    expect(auditLogMock).toHaveBeenCalledWith(
      "User Management",
      "User deleted: amy@example.com",
      "User",
      "user-1",
      "user-1",
    );
    expect(infoMock).toHaveBeenCalledWith("User deleted", {
      module: "user",
      user_id: "user-1",
    });
  });

  it("throws when deleting a missing user", async () => {
    updateByIdMock.mockResolvedValue(null);

    await expect(service.deleteUser("missing")).rejects.toThrow(NotFoundError);

    expect(auditLogMock).not.toHaveBeenCalled();
    expect(infoMock).not.toHaveBeenCalled();
  });
});
