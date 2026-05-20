import { COOKIE_NAMES, TOKEN_EXPIRY } from "@petec/shared";
import { jest } from "@jest/globals";
import type { Response } from "express";

const signMock = jest.fn();
const verifyMock = jest.fn();

const loadAuthTokensModule = async (isProduction: boolean) => {
  jest.resetModules();
  signMock.mockReset();
  verifyMock.mockReset();

  jest.unstable_mockModule("jsonwebtoken", () => ({
    default: {
      sign: signMock,
      verify: verifyMock,
    },
  }));

  jest.unstable_mockModule("../../src/config/config.js", () => ({
    ENV: {
      jwtAccessSecret: "access-secret-123",
      jwtRefreshSecret: "refresh-secret-123",
      jwtResetPasswordSecret: "reset-secret-123",
      accessTokenExpiresIn: "30m",
      refreshTokenExpiresIn: "7d",
      refreshTokenExpiresInMs: 7777,
      isProduction,
    },
  }));

  return import("../../src/utils/authTokens.js");
};

const createResponse = (): Response =>
  ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  }) as unknown as Response;

describe("authTokens", () => {
  it("generates and verifies access and refresh tokens", async () => {
    const authTokens = await loadAuthTokensModule(false);
    signMock.mockReturnValue("signed-token");
    verifyMock.mockReturnValue({ userId: "user-1" });

    expect(
      authTokens.generateAccessToken({
        userId: "user-1",
        role: "ADMIN",
        privileges: [],
        username: "admin",
        fullName: "Dana Levi",
      } as never),
    ).toBe("signed-token");
    expect(signMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      "access-secret-123",
      { expiresIn: "30m" },
    );

    expect(
      authTokens.generateRefreshToken({
        userId: "user-1",
        role: "ADMIN",
        privileges: [],
        username: "admin",
        fullName: "Dana Levi",
      } as never),
    ).toBe("signed-token");
    expect(signMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      "refresh-secret-123",
      { expiresIn: "7d" },
    );

    expect(authTokens.verifyAccessToken("token")).toEqual({ userId: "user-1" });
    expect(verifyMock).toHaveBeenCalledWith("token", "access-secret-123");

    expect(authTokens.verifyRefreshToken("token")).toEqual({ userId: "user-1" });
    expect(verifyMock).toHaveBeenCalledWith("token", "refresh-secret-123");
  });

  it("generates and verifies reset-password tokens", async () => {
    const authTokens = await loadAuthTokensModule(false);
    signMock.mockReturnValue("reset-token");
    verifyMock.mockReturnValue({ userId: "user-1" });

    expect(authTokens.generateResetPasswordToken("user-1")).toBe("reset-token");
    expect(signMock).toHaveBeenCalledWith(
      { userId: "user-1" },
      "reset-secret-123",
      { expiresIn: TOKEN_EXPIRY.RESET_PASSWORD },
    );

    expect(authTokens.verifyResetPasswordToken("token")).toEqual({
      userId: "user-1",
    });
    expect(verifyMock).toHaveBeenCalledWith("token", "reset-secret-123");
  });

  it("sets refresh cookies with environment-aware options", async () => {
    const authTokens = await loadAuthTokensModule(false);
    const res = createResponse();

    authTokens.setRefreshCookie(res, "refresh-token");

    expect(res.cookie).toHaveBeenCalledWith(
      COOKIE_NAMES.REFRESH,
      "refresh-token",
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7777,
        path: "/api/v1/auth",
      },
    );
  });

  it("clears refresh cookies without maxAge and with production sameSite", async () => {
    const authTokens = await loadAuthTokensModule(true);
    const res = createResponse();

    authTokens.clearRefreshCookie(res);

    expect(res.clearCookie).toHaveBeenCalledWith(COOKIE_NAMES.REFRESH, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/v1/auth",
    });
  });
});