import { BCRYPT_SALT_ROUNDS } from "@petec/shared";
import { jest } from "@jest/globals";
import {
  AuthError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../src/constants/error.constants.js";

const bcryptHashMock = jest.fn<(...args: any[]) => Promise<string>>();
const bcryptCompareMock = jest.fn<(...args: any[]) => Promise<boolean>>();

const findByEmailMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const findByUsernameMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const createMock = jest.fn<(...args: any[]) => Promise<any>>();
const findByUsernameWithPasswordMock = jest.fn<
  (...args: any[]) => Promise<any | null>
>();
const addRefreshTokenMock = jest.fn<(...args: any[]) => Promise<void>>();
const updateLastLoginMock = jest.fn<(...args: any[]) => Promise<void>>();
const findByIdWithRefreshTokensMock = jest.fn<
  (...args: any[]) => Promise<any | null>
>();
const removeAllRefreshTokensMock = jest.fn<(...args: any[]) => Promise<void>>();
const removeRefreshTokenMock = jest.fn<(...args: any[]) => Promise<void>>();
const findByIdMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const updateByIdMock = jest.fn<(...args: any[]) => Promise<any>>();

const auditLogMock = jest.fn<(...args: any[]) => Promise<void>>();

const generateAccessTokenMock = jest.fn<(payload: any) => string>();
const generateRefreshTokenMock = jest.fn<(payload: any) => string>();
const verifyRefreshTokenMock = jest.fn<(token: string) => any>();
const generateResetPasswordTokenMock = jest.fn<(userId: string) => string>();
const verifyResetPasswordTokenMock = jest.fn<(token: string) => any>();
const setRefreshCookieMock = jest.fn<(...args: any[]) => void>();
const clearRefreshCookieMock = jest.fn<(...args: any[]) => void>();

const sendEmailMock = jest.fn<(...args: any[]) => Promise<void>>();
const infoMock = jest.fn<(...args: any[]) => void>();
const warnMock = jest.fn<(...args: any[]) => void>();

const buildAuthTokenPayloadMock = jest.fn<(user: any) => any>();
const buildUserFullNameMock = jest.fn<(user: any) => string>();
const findMatchingRefreshTokenMock = jest.fn<(...args: any[]) => Promise<any>>();
const isActiveUserMock = jest.fn<(user: any) => boolean>();

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    hash: bcryptHashMock,
    compare: bcryptCompareMock,
  },
}));

jest.unstable_mockModule("../../../src/repositories/user/index.js", () => ({
  userRepository: {
    findByEmail: findByEmailMock,
    findByUsername: findByUsernameMock,
    create: createMock,
    findByUsernameWithPassword: findByUsernameWithPasswordMock,
    addRefreshToken: addRefreshTokenMock,
    updateLastLogin: updateLastLoginMock,
    findByIdWithRefreshTokens: findByIdWithRefreshTokensMock,
    removeAllRefreshTokens: removeAllRefreshTokensMock,
    removeRefreshToken: removeRefreshTokenMock,
    findById: findByIdMock,
    updateById: updateByIdMock,
  },
}));

jest.unstable_mockModule("../../../src/repositories/audit/index.js", () => ({
  auditRepository: {
    log: auditLogMock,
  },
}));

jest.unstable_mockModule("../../../src/utils/authTokens.js", () => ({
  generateAccessToken: generateAccessTokenMock,
  generateRefreshToken: generateRefreshTokenMock,
  verifyRefreshToken: verifyRefreshTokenMock,
  generateResetPasswordToken: generateResetPasswordTokenMock,
  verifyResetPasswordToken: verifyResetPasswordTokenMock,
  setRefreshCookie: setRefreshCookieMock,
  clearRefreshCookie: clearRefreshCookieMock,
}));

jest.unstable_mockModule("../../../src/utils/emailUtils.js", () => ({
  sendEmail: sendEmailMock,
}));

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
    warn: warnMock,
  },
}));

jest.unstable_mockModule("../../../src/config/config.js", () => ({
  ENV: {
    refreshTokenExpiresInMs: 60 * 60 * 1000,
    frontendUrl: "https://frontend.test",
  },
}));

jest.unstable_mockModule("../../../src/services/auth/utils/authService.utils.js", () => ({
  buildAuthTokenPayload: buildAuthTokenPayloadMock,
  buildUserFullName: buildUserFullNameMock,
  findMatchingRefreshToken: findMatchingRefreshTokenMock,
  isActiveUser: isActiveUserMock,
}));

const { AuthService } = await import("../../../src/services/auth/authService.js");

const createUser = (overrides: Record<string, unknown> = {}) => {
  const id =
    overrides._id ??
    ({
      toString: () => "user-1",
    } as const);

  return {
    _id: id,
    username: "admin",
    firstName: "Dana",
    lastName: "Levi",
    email: "admin@example.com",
    role: "ADMIN",
    privileges: ["*"],
    status: "ACTIVE",
    isDeleted: false,
    passwordHash: "stored-password-hash",
    refreshTokens: [],
    ...overrides,
  };
};

describe("AuthService", () => {
  const service = new AuthService();
  const res = {} as never;

  beforeEach(() => {
    bcryptHashMock.mockReset();
    bcryptCompareMock.mockReset();
    findByEmailMock.mockReset();
    findByUsernameMock.mockReset();
    createMock.mockReset();
    findByUsernameWithPasswordMock.mockReset();
    addRefreshTokenMock.mockReset();
    updateLastLoginMock.mockReset();
    findByIdWithRefreshTokensMock.mockReset();
    removeAllRefreshTokensMock.mockReset();
    removeRefreshTokenMock.mockReset();
    findByIdMock.mockReset();
    updateByIdMock.mockReset();
    auditLogMock.mockReset();
    generateAccessTokenMock.mockReset();
    generateRefreshTokenMock.mockReset();
    verifyRefreshTokenMock.mockReset();
    generateResetPasswordTokenMock.mockReset();
    verifyResetPasswordTokenMock.mockReset();
    setRefreshCookieMock.mockReset();
    clearRefreshCookieMock.mockReset();
    sendEmailMock.mockReset();
    infoMock.mockReset();
    warnMock.mockReset();
    buildAuthTokenPayloadMock.mockReset();
    buildUserFullNameMock.mockReset();
    findMatchingRefreshTokenMock.mockReset();
    isActiveUserMock.mockReset();

    isActiveUserMock.mockReturnValue(true);
    buildAuthTokenPayloadMock.mockReturnValue({
      userId: "user-1",
      role: "ADMIN",
      privileges: ["*"],
      username: "admin",
      fullName: "Dana Levi",
    });
    buildUserFullNameMock.mockReturnValue("Dana Levi");
  });

  it("rejects registration when the email already exists", async () => {
    findByEmailMock.mockResolvedValue(createUser());

    await expect(
      service.register({
        username: "admin",
        firstName: "Dana",
        lastName: "Levi",
        email: "admin@example.com",
        password: "secret",
        role: "ADMIN",
      } as never),
    ).rejects.toThrow(ConflictError);

    expect(findByUsernameMock).not.toHaveBeenCalled();
  });

  it("rejects registration when the username already exists", async () => {
    findByEmailMock.mockResolvedValue(null);
    findByUsernameMock.mockResolvedValue(createUser());

    await expect(
      service.register({
        username: "admin",
        firstName: "Dana",
        lastName: "Levi",
        email: "admin@example.com",
        password: "secret",
        role: "ADMIN",
      } as never),
    ).rejects.toThrow(ConflictError);

    expect(createMock).not.toHaveBeenCalled();
  });

  it("registers a new user, hashing the password and writing an audit log", async () => {
    const createdUser = createUser({
      _id: {
        toString: () => "user-1",
      },
      email: "admin@example.com",
    });
    findByEmailMock.mockResolvedValue(null);
    findByUsernameMock.mockResolvedValue(null);
    bcryptHashMock.mockResolvedValue("hashed-password");
    createMock.mockResolvedValue(createdUser);
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.register({
        username: "admin",
        firstName: "Dana",
        lastName: "Levi",
        email: "Admin@Example.com",
        password: "secret",
        role: "ADMIN",
        privileges: ["*"],
      } as never),
    ).resolves.toEqual({
      id: "user-1",
      username: "admin",
      firstName: "Dana",
      lastName: "Levi",
      email: "admin@example.com",
      role: "ADMIN",
    });

    expect(bcryptHashMock).toHaveBeenCalledWith("secret", BCRYPT_SALT_ROUNDS);
    expect(createMock).toHaveBeenCalledWith({
      username: "admin",
      firstName: "Dana",
      lastName: "Levi",
      email: "admin@example.com",
      passwordHash: "hashed-password",
      role: "ADMIN",
      privileges: ["*"],
    });
    expect(auditLogMock).toHaveBeenCalledWith(
      "Authentication",
      "User registered: admin (Admin@Example.com)",
      "User",
      "user-1",
    );
  });

  it("rejects login when the username is unknown", async () => {
    findByUsernameWithPasswordMock.mockResolvedValue(null);

    await expect(
      service.login({ username: "admin", password: "secret" } as never, res),
    ).rejects.toThrow(AuthError);

    expect(bcryptCompareMock).not.toHaveBeenCalled();
  });

  it("rejects login for inactive accounts", async () => {
    findByUsernameWithPasswordMock.mockResolvedValue(createUser());
    isActiveUserMock.mockReturnValue(false);

    await expect(
      service.login({ username: "admin", password: "secret" } as never, res),
    ).rejects.toThrow("Account is inactive");
  });

  it("rejects login when the password is invalid", async () => {
    findByUsernameWithPasswordMock.mockResolvedValue(createUser());
    bcryptCompareMock.mockResolvedValue(false);

    await expect(
      service.login({ username: "admin", password: "secret" } as never, res),
    ).rejects.toThrow("Invalid username or password");
  });

  it("logs users in, rotates refresh cookies, and returns the auth payload", async () => {
    const user = createUser();
    findByUsernameWithPasswordMock.mockResolvedValue(user);
    bcryptCompareMock.mockResolvedValue(true);
    generateAccessTokenMock.mockReturnValue("access-token");
    generateRefreshTokenMock.mockReturnValue("refresh-token");
    bcryptHashMock.mockResolvedValue("hashed-refresh-token");
    addRefreshTokenMock.mockResolvedValue(undefined);
    updateLastLoginMock.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    const result = await service.login(
      { username: "admin", password: "secret" } as never,
      res,
    );

    expect(buildAuthTokenPayloadMock).toHaveBeenCalledWith(user);
    expect(generateAccessTokenMock).toHaveBeenCalledWith(
      buildAuthTokenPayloadMock.mock.results[0]?.value,
    );
    expect(generateRefreshTokenMock).toHaveBeenCalledWith(
      buildAuthTokenPayloadMock.mock.results[0]?.value,
    );
    expect(bcryptHashMock).toHaveBeenCalledWith(
      "refresh-token",
      BCRYPT_SALT_ROUNDS,
    );
    expect(addRefreshTokenMock).toHaveBeenCalledWith(
      user._id,
      expect.objectContaining({
        tokenHash: "hashed-refresh-token",
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
      }),
    );
    expect(updateLastLoginMock).toHaveBeenCalledWith(user._id);
    expect(setRefreshCookieMock).toHaveBeenCalledWith(res, "refresh-token");
    expect(auditLogMock).toHaveBeenCalledWith(
      "Authentication",
      "User logged in: admin",
      "User",
      "user-1",
      user._id,
    );
    expect(infoMock).toHaveBeenCalledWith("Login success", {
      module: "auth",
      event: "auth_login_success",
      user_id: "user-1",
      username: "admin",
    });
    expect(result).toEqual({
      accessToken: "access-token",
      user: {
        id: "user-1",
        username: "admin",
        fullName: "Dana Levi",
        email: "admin@example.com",
        role: "ADMIN",
        privileges: ["*"],
        lastLogin: expect.any(String),
      },
    });
  });

  it("clears cookies when refresh token verification fails", async () => {
    verifyRefreshTokenMock.mockImplementation(() => {
      throw new Error("bad token");
    });

    await expect(service.refresh("bad-refresh", res)).rejects.toThrow(
      "Invalid or expired refresh token",
    );

    expect(clearRefreshCookieMock).toHaveBeenCalledWith(res);
  });

  it("clears cookies when the refresh user is missing", async () => {
    verifyRefreshTokenMock.mockReturnValue({ userId: "missing" });
    findByIdWithRefreshTokensMock.mockResolvedValue(null);

    await expect(service.refresh("refresh-token", res)).rejects.toThrow(
      "User not found",
    );

    expect(clearRefreshCookieMock).toHaveBeenCalledWith(res);
  });

  it("clears cookies when the refresh user is inactive", async () => {
    verifyRefreshTokenMock.mockReturnValue({ userId: "user-1" });
    findByIdWithRefreshTokensMock.mockResolvedValue(createUser());
    isActiveUserMock.mockReturnValue(false);

    await expect(service.refresh("refresh-token", res)).rejects.toThrow(
      "Account is inactive",
    );

    expect(clearRefreshCookieMock).toHaveBeenCalledWith(res);
  });

  it("detects refresh token reuse and removes all stored refresh tokens", async () => {
    const user = createUser();
    verifyRefreshTokenMock.mockReturnValue({ userId: "user-1" });
    findByIdWithRefreshTokensMock.mockResolvedValue(user);
    findMatchingRefreshTokenMock.mockResolvedValue(undefined);
    removeAllRefreshTokensMock.mockResolvedValue(undefined);

    await expect(service.refresh("refresh-token", res)).rejects.toThrow(
      "Refresh token reuse detected",
    );

    expect(removeAllRefreshTokensMock).toHaveBeenCalledWith(user._id);
    expect(clearRefreshCookieMock).toHaveBeenCalledWith(res);
    expect(warnMock).toHaveBeenCalledWith(
      "Refresh token reuse detected, clearing all tokens",
      { module: "auth", user_id: "user-1" },
    );
  });

  it("refreshes tokens, rotates the stored refresh hash, and sets a new cookie", async () => {
    const user = createUser();
    const validToken = {
      tokenHash: "old-token-hash",
      expiresAt: new Date("2999-01-01T00:00:00.000Z"),
    };
    verifyRefreshTokenMock.mockReturnValue({ userId: "user-1" });
    findByIdWithRefreshTokensMock.mockResolvedValue(user);
    findMatchingRefreshTokenMock.mockResolvedValue(validToken);
    generateAccessTokenMock.mockReturnValue("new-access-token");
    generateRefreshTokenMock.mockReturnValue("new-refresh-token");
    bcryptHashMock.mockResolvedValue("new-refresh-hash");
    removeRefreshTokenMock.mockResolvedValue(undefined);
    addRefreshTokenMock.mockResolvedValue(undefined);

    await expect(service.refresh("refresh-token", res)).resolves.toEqual({
      accessToken: "new-access-token",
    });

    expect(removeRefreshTokenMock).toHaveBeenCalledWith(
      user._id,
      "old-token-hash",
    );
    expect(addRefreshTokenMock).toHaveBeenCalledWith(
      user._id,
      expect.objectContaining({
        tokenHash: "new-refresh-hash",
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date),
      }),
    );
    expect(setRefreshCookieMock).toHaveBeenCalledWith(res, "new-refresh-token");
    expect(infoMock).toHaveBeenCalledWith("Token refresh success", {
      module: "auth",
      event: "auth_refresh_success",
      user_id: "user-1",
    });
  });

  it("logs out by resolving the user id from a refresh token and removing the matching hash", async () => {
    const user = createUser();
    const matchingToken = {
      tokenHash: "matching-hash",
      expiresAt: new Date("2999-01-01T00:00:00.000Z"),
    };
    verifyRefreshTokenMock.mockReturnValue({ userId: "user-1" });
    findByIdWithRefreshTokensMock.mockResolvedValue(user);
    findMatchingRefreshTokenMock.mockResolvedValue(matchingToken);
    removeRefreshTokenMock.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(service.logout(undefined, "refresh-token", res)).resolves.toBeUndefined();

    expect(findByIdWithRefreshTokensMock).toHaveBeenCalledWith("user-1");
    expect(removeRefreshTokenMock).toHaveBeenCalledWith("user-1", "matching-hash");
    expect(clearRefreshCookieMock).toHaveBeenCalledWith(res);
    expect(auditLogMock).toHaveBeenCalledWith(
      "Authentication",
      "User logged out",
      "User",
      "user-1",
      "user-1",
    );
    expect(infoMock).toHaveBeenCalledWith("Logout success", {
      module: "auth",
      event: "auth_logout_success",
      user_id: "user-1",
    });
  });

  it("clears cookies during logout even when the refresh token is invalid", async () => {
    verifyRefreshTokenMock.mockImplementation(() => {
      throw new Error("bad token");
    });

    await expect(service.logout(undefined, "bad-token", res)).resolves.toBeUndefined();

    expect(clearRefreshCookieMock).toHaveBeenCalledWith(res);
    expect(auditLogMock).not.toHaveBeenCalled();
    expect(infoMock).not.toHaveBeenCalledWith(
      "Logout success",
      expect.anything(),
    );
  });

  it("silently ignores forgot-password requests for unknown emails", async () => {
    findByEmailMock.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: "missing@example.com" } as never),
    ).resolves.toBeUndefined();

    expect(generateResetPasswordTokenMock).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("emails reset-password links for known users", async () => {
    const user = createUser();
    findByEmailMock.mockResolvedValue(user);
    generateResetPasswordTokenMock.mockReturnValue("reset-token");
    sendEmailMock.mockResolvedValue(undefined);

    await expect(
      service.forgotPassword({ email: "admin@example.com" } as never),
    ).resolves.toBeUndefined();

    expect(generateResetPasswordTokenMock).toHaveBeenCalledWith("user-1");
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@example.com",
        subject: "Password Reset Request",
        html: expect.stringContaining("https://frontend.test"),
      }),
    );
    expect(sendEmailMock.mock.calls[0]?.[0]?.html).toContain("reset-token");
    expect(infoMock).toHaveBeenCalledWith("Password reset requested", {
      module: "auth",
      event: "auth_password_reset_requested",
      user_id: "user-1",
    });
  });

  it("rejects reset-password requests with invalid tokens", async () => {
    verifyResetPasswordTokenMock.mockImplementation(() => {
      throw new Error("bad token");
    });

    await expect(
      service.resetPassword({ token: "bad", password: "new-secret" } as never),
    ).rejects.toThrow(BadRequestError);
  });

  it("rejects reset-password requests when the user no longer exists", async () => {
    verifyResetPasswordTokenMock.mockReturnValue({ userId: "missing" });
    findByIdMock.mockResolvedValue(null);

    await expect(
      service.resetPassword({ token: "valid", password: "new-secret" } as never),
    ).rejects.toThrow(NotFoundError);
  });

  it("resets the password, clears refresh tokens, and writes audit logs", async () => {
    const user = createUser();
    verifyResetPasswordTokenMock.mockReturnValue({ userId: "user-1" });
    findByIdMock.mockResolvedValue(user);
    bcryptHashMock.mockResolvedValue("new-password-hash");
    updateByIdMock.mockResolvedValue(user);
    removeAllRefreshTokensMock.mockResolvedValue(undefined);
    auditLogMock.mockResolvedValue(undefined);

    await expect(
      service.resetPassword({ token: "valid", password: "new-secret" } as never),
    ).resolves.toBeUndefined();

    expect(bcryptHashMock).toHaveBeenCalledWith(
      "new-secret",
      BCRYPT_SALT_ROUNDS,
    );
    expect(updateByIdMock).toHaveBeenCalledWith(user._id, {
      $set: { passwordHash: "new-password-hash" },
    });
    expect(removeAllRefreshTokensMock).toHaveBeenCalledWith(user._id);
    expect(auditLogMock).toHaveBeenCalledWith(
      "Authentication",
      "Password reset completed",
      "User",
      "user-1",
      user._id,
    );
    expect(infoMock).toHaveBeenCalledWith("Password reset completed", {
      module: "auth",
      event: "auth_password_reset_completed",
      user_id: "user-1",
    });
  });
});
