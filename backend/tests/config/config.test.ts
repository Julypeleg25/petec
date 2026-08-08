import { jest } from "@jest/globals";

const dotenvConfigMock = jest.fn();
const normalizeDurationStringMock = jest.fn();
const parseDurationToMillisecondsMock = jest.fn();

const ORIGINAL_ENV = { ...process.env };

const restoreProcessEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

const setRequiredSecrets = () => {
  process.env.JWT_ACCESS_SECRET = "access-secret-123";
  process.env.JWT_REFRESH_SECRET = "refresh-secret-123";
  process.env.MJ_APIKEY_PUBLIC = "mailjet-public";
  process.env.MJ_APIKEY_PRIVATE = "mailjet-private";
  process.env.MONGODB_URI = "mongodb://localhost:27017/petec-test";
  process.env.FRONTEND_URL = "https://petec.vercel.app";
  process.env.NODE_ENV = "test";
  delete process.env.JWT_RESET_PASSWORD_SECRET;
};

const loadConfigModule = async () => {
  jest.unstable_mockModule("dotenv", () => ({
    default: {
      config: dotenvConfigMock,
    },
  }));

  jest.unstable_mockModule("../../src/config/config.utils.js", () => ({
    normalizeDurationString: normalizeDurationStringMock,
    parseDurationToMilliseconds: parseDurationToMillisecondsMock,
  }));

  return import("../../src/config/config.js");
};

describe("config.ts", () => {
  beforeEach(() => {
    jest.resetModules();
    dotenvConfigMock.mockReset();
    normalizeDurationStringMock.mockReset();
    parseDurationToMillisecondsMock.mockReset();
  });

  afterEach(() => {
    restoreProcessEnv();
  });

  it("builds ENV from config and environment secrets", async () => {
    setRequiredSecrets();
    normalizeDurationStringMock
      .mockReturnValueOnce("1h")
      .mockReturnValueOnce("1d");
    parseDurationToMillisecondsMock
      .mockReturnValueOnce(3_600_000)
      .mockReturnValueOnce(86_400_000);

    const { ENV } = await loadConfigModule();

    expect(dotenvConfigMock).toHaveBeenCalled();
    expect(normalizeDurationStringMock).toHaveBeenNthCalledWith(1, "1h");
    expect(normalizeDurationStringMock).toHaveBeenNthCalledWith(2, "1d");
    expect(parseDurationToMillisecondsMock).toHaveBeenNthCalledWith(1, "1h");
    expect(parseDurationToMillisecondsMock).toHaveBeenNthCalledWith(2, "1d");

    expect(ENV).toMatchObject({
      port: 5000,
      mongoDBUri: expect.stringContaining("mongodb"),
      frontendUrl: "https://petec.vercel.app",
      nodeEnv: "test",
      isProduction: false,
      isDevelopment: false,
      isTest: true,
      mailAdmin: "julypeleg@gmail.com",
      jwtAccessSecret: "access-secret-123",
      jwtRefreshSecret: "refresh-secret-123",
      jwtResetPasswordSecret: "access-secret-123",
      mailjetPublicKey: "mailjet-public",
      mailjetPrivateKey: "mailjet-private",
      accessTokenExpiresIn: "1h",
      accessTokenExpiresInMs: 3_600_000,
      refreshTokenExpiresIn: "1d",
      refreshTokenExpiresInMs: 86_400_000,
    });
  });

  it("throws a descriptive error when required environment variables are missing", async () => {
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.MJ_APIKEY_PUBLIC;
    delete process.env.MJ_APIKEY_PRIVATE;

    await expect(loadConfigModule()).rejects.toThrow("Invalid environment variables");
  });
});
