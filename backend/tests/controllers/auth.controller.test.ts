import {
  COOKIE_NAMES,
  ForgotPasswordMessageSchema,
  LoginResponseSchema,
  RefreshResponseSchema,
  RegisterResponseDTOSchema,
} from "@petec/shared";
import { jest } from "@jest/globals";
import { AuthError } from "../../src/constants/error.constants.js";

const registerMock = jest.fn<(...args: any[]) => Promise<any>>();
const loginMock = jest.fn<(...args: any[]) => Promise<any>>();
const refreshMock = jest.fn<(...args: any[]) => Promise<any>>();
const logoutMock = jest.fn<(...args: any[]) => Promise<void>>();
const forgotPasswordMock = jest.fn<(...args: any[]) => Promise<void>>();
const resetPasswordMock = jest.fn<(...args: any[]) => Promise<void>>();
const sendSuccessMock = jest.fn<(...args: any[]) => void>();
const sendCreatedMock = jest.fn<(...args: any[]) => void>();
const sendNoContentMock = jest.fn<(...args: any[]) => void>();
const getValidatedBodyMock = jest.fn<(req: any) => any>();

jest.unstable_mockModule("../../src/services/auth/index.js", () => ({
  authService: {
    register: registerMock,
    login: loginMock,
    refresh: refreshMock,
    logout: logoutMock,
    forgotPassword: forgotPasswordMock,
    resetPassword: resetPasswordMock,
  },
}));

jest.unstable_mockModule("../../src/utils/apiResponse.js", () => ({
  sendSuccess: sendSuccessMock,
  sendCreated: sendCreatedMock,
  sendNoContent: sendNoContentMock,
}));

jest.unstable_mockModule("../../src/utils/request.utils.js", () => ({
  getValidatedBody: getValidatedBodyMock,
}));

const { AuthController } = await import("../../src/controllers/auth/auth.controller.js");

describe("AuthController", () => {
  const controller = new AuthController();
  const res = {} as never;
  const next = jest.fn<(err?: unknown) => void>();

  beforeEach(() => {
    registerMock.mockReset();
    loginMock.mockReset();
    refreshMock.mockReset();
    logoutMock.mockReset();
    forgotPasswordMock.mockReset();
    resetPasswordMock.mockReset();
    sendSuccessMock.mockReset();
    sendCreatedMock.mockReset();
    sendNoContentMock.mockReset();
    getValidatedBodyMock.mockReset();
    next.mockReset();
  });

  it("registers users and responds with created payloads", async () => {
    const body = { email: "doctor@example.com" };
    const result = { id: "user-1" };
    getValidatedBodyMock.mockReturnValue(body);
    registerMock.mockResolvedValue(result);

    await controller.register({ body } as never, res, next);

    expect(getValidatedBodyMock).toHaveBeenCalled();
    expect(registerMock).toHaveBeenCalledWith(body);
    expect(sendCreatedMock).toHaveBeenCalledWith(res, result, RegisterResponseDTOSchema);
    expect(next).not.toHaveBeenCalled();
  });

  it("logs users in and returns the login schema response", async () => {
    const body = { email: "doctor@example.com", password: "secret" };
    const result = { accessToken: "access-token" };
    getValidatedBodyMock.mockReturnValue(body);
    loginMock.mockResolvedValue(result);

    await controller.login({ body } as never, res, next);

    expect(loginMock).toHaveBeenCalledWith(body, res);
    expect(sendSuccessMock).toHaveBeenCalledWith(res, result, LoginResponseSchema);
  });

  it("refreshes access tokens when a refresh cookie is present", async () => {
    const result = { accessToken: "new-token" };
    refreshMock.mockResolvedValue(result);

    await controller.refresh(
      {
        cookies: {
          [COOKIE_NAMES.REFRESH]: "refresh-token",
        },
      } as never,
      res,
      next,
    );

    expect(refreshMock).toHaveBeenCalledWith("refresh-token", res);
    expect(sendSuccessMock).toHaveBeenCalledWith(res, result, RefreshResponseSchema);
  });

  it("rejects refresh requests when the cookie is missing", async () => {
    await controller.refresh({ cookies: {} } as never, res, next);

    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(AuthError);
    expect((error as Error).message).toBe("No refresh token");
    expect(refreshMock).not.toHaveBeenCalled();
    expect(sendSuccessMock).not.toHaveBeenCalled();
  });

  it("logs users out with the available user id and refresh token", async () => {
    logoutMock.mockResolvedValue(undefined);

    await controller.logout(
      {
        cookies: {
          [COOKIE_NAMES.REFRESH]: "refresh-token",
        },
        authenticatedUser: {
          userId: "user-1",
        },
      } as never,
      res,
      next,
    );

    expect(logoutMock).toHaveBeenCalledWith("user-1", "refresh-token", res);
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });

  it("sends the generic forgot-password confirmation message", async () => {
    const body = { email: "doctor@example.com" };
    getValidatedBodyMock.mockReturnValue(body);
    forgotPasswordMock.mockResolvedValue(undefined);

    await controller.forgotPassword({ body } as never, res, next);

    expect(forgotPasswordMock).toHaveBeenCalledWith(body);
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      { message: "If the email exists, a reset link has been sent" },
      ForgotPasswordMessageSchema,
    );
  });

  it("resets passwords and returns no content", async () => {
    const body = { token: "reset-token", password: "new-password" };
    getValidatedBodyMock.mockReturnValue(body);
    resetPasswordMock.mockResolvedValue(undefined);

    await controller.resetPassword({ body } as never, res, next);

    expect(resetPasswordMock).toHaveBeenCalledWith(body);
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });
});
