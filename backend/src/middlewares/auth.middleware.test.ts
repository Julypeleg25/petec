import { Permission, roles } from "@petec/shared";
import { jest } from "@jest/globals";
import { AuthError, ForbiddenError } from "../constants/error.constants.js";

const verifyAccessTokenMock = jest.fn();
const warnMock = jest.fn();

jest.unstable_mockModule("../utils/authTokens.js", () => ({
  verifyAccessToken: verifyAccessTokenMock,
}));

jest.unstable_mockModule("../config/logger.js", () => ({
  logger: {
    warn: warnMock,
  },
}));

const {
  authenticate,
  authorize,
  requireAdmin,
  requirePermission,
} = await import("./auth.middleware.js");

const createRequest = (overrides: Record<string, unknown> = {}) =>
  ({
    headers: {},
    method: "GET",
    originalUrl: "/api/v1/patient?tab=all",
    requestId: "req-1",
    ...overrides,
  }) as any;

describe("auth middleware", () => {
  afterEach(() => {
    verifyAccessTokenMock.mockReset();
    warnMock.mockReset();
  });

  it("rejects missing auth headers", () => {
    const next = jest.fn();

    authenticate(createRequest(), {} as never, next);

    const error = next.mock.calls[0][0] as Error;
    expect(error).toBeInstanceOf(AuthError);
    expect(error.message).toBe("Missing or invalid authorization header");
  });

  it("authenticates valid bearer tokens and enriches request context", () => {
    verifyAccessTokenMock.mockReturnValue({
      userId: "user-1",
      role: roles.DOCTOR,
      privileges: [Permission.READ_PATIENT],
    });
    const next = jest.fn();
    const req: any = createRequest({
      headers: {
        authorization: "Bearer access-token",
      },
      ctx: {
        requestId: "req-1",
      },
    });

    authenticate(req, {} as never, next);

    expect(verifyAccessTokenMock).toHaveBeenCalledWith("access-token");
    expect(req.authenticatedUser).toEqual({
      userId: "user-1",
      role: roles.DOCTOR,
      privileges: [Permission.READ_PATIENT],
    });
    expect(req.ctx.user).toEqual({
      userId: "user-1",
      role: roles.DOCTOR,
      permissions: [Permission.READ_PATIENT],
    });
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects invalid bearer tokens", () => {
    verifyAccessTokenMock.mockImplementation(() => {
      throw new Error("bad token");
    });
    const next = jest.fn();

    authenticate(
      createRequest({
        headers: {
          authorization: "Bearer bad-token",
        },
      }),
      {} as never,
      next,
    );

    const error = next.mock.calls[0][0] as Error;
    expect(error).toBeInstanceOf(AuthError);
    expect(error.message).toBe("Invalid or expired access token");
  });

  it("authorizes allowed roles and rejects missing or wrong roles", () => {
    const noUserNext = jest.fn();
    authorize(roles.ADMIN)(createRequest(), {} as never, noUserNext);
    expect(noUserNext.mock.calls[0][0]).toBeInstanceOf(AuthError);

    const wrongRoleNext = jest.fn();
    authorize(roles.ADMIN)(
      createRequest({
        authenticatedUser: {
          userId: "user-1",
          role: roles.DOCTOR,
          privileges: [],
        },
      }),
      {} as never,
      wrongRoleNext,
    );
    expect(wrongRoleNext.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    expect(warnMock).toHaveBeenCalledWith("Insufficient role privileges", {
      module: "auth",
      request_id: "req-1",
      user_id: "user-1",
      route: "GET /api/v1/patient",
      required_roles: roles.ADMIN,
      user_role: roles.DOCTOR,
    });

    const allowedNext = jest.fn();
    requireAdmin(
      createRequest({
        authenticatedUser: {
          userId: "admin-1",
          role: roles.ADMIN,
          privileges: [],
        },
      }),
      {} as never,
      allowedNext,
    );
    expect(allowedNext).toHaveBeenCalledWith();
  });

  it("checks permissions and logs authorization failures", () => {
    const noUserNext = jest.fn();
    requirePermission(Permission.READ_PATIENT)(
      createRequest(),
      {} as never,
      noUserNext,
    );
    expect(noUserNext.mock.calls[0][0]).toBeInstanceOf(AuthError);

    const unknownRoleNext = jest.fn();
    requirePermission(Permission.READ_PATIENT)(
      createRequest({
        authenticatedUser: {
          userId: "user-1",
          role: "UNKNOWN",
          privileges: [],
        },
      }),
      {} as never,
      unknownRoleNext,
    );
    expect(unknownRoleNext.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    expect(warnMock).toHaveBeenCalledWith("Unknown role encountered", {
      module: "auth",
      request_id: "req-1",
      user_id: "user-1",
      route: "GET /api/v1/patient",
      user_role: "UNKNOWN",
    });

    const insufficientNext = jest.fn();
    requirePermission(Permission.WRITE_PATIENT)(
      createRequest({
        authenticatedUser: {
          userId: "user-2",
          role: roles.RECEPTION,
          privileges: [],
        },
      }),
      {} as never,
      insufficientNext,
    );
    expect(insufficientNext.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
    expect(warnMock).toHaveBeenCalledWith("Insufficient permissions", {
      module: "auth",
      request_id: "req-1",
      user_id: "user-2",
      route: "GET /api/v1/patient",
      required_permissions: Permission.WRITE_PATIENT,
    });

    const wildcardNext = jest.fn();
    requirePermission(Permission.WRITE_PATIENT)(
      createRequest({
        authenticatedUser: {
          userId: "admin-1",
          role: roles.ADMIN,
          privileges: [],
        },
      }),
      {} as never,
      wildcardNext,
    );
    expect(wildcardNext).toHaveBeenCalledWith();

    const sufficientNext = jest.fn();
    requirePermission(Permission.READ_PATIENT)(
      createRequest({
        authenticatedUser: {
          userId: "doctor-1",
          role: roles.DOCTOR,
          privileges: [],
        },
      }),
      {} as never,
      sufficientNext,
    );
    expect(sufficientNext).toHaveBeenCalledWith();
  });
});
