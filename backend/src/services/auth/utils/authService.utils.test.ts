import { jest } from "@jest/globals";

const compareMock = jest.fn<(raw: string, hash: string) => Promise<boolean>>();

jest.unstable_mockModule("bcryptjs", () => ({
  default: {
    compare: compareMock,
  },
}));

const {
  buildAuthTokenPayload,
  buildUserFullName,
  findMatchingRefreshToken,
  isActiveUser,
} = await import("./authService.utils.js");

describe("authService.utils", () => {
  afterEach(() => {
    compareMock.mockReset();
  });

  it("checks whether a user is active", () => {
    expect(isActiveUser({ status: "ACTIVE", isDeleted: false } as never)).toBe(true);
    expect(isActiveUser({ status: "INACTIVE", isDeleted: false } as never)).toBe(false);
    expect(isActiveUser({ status: "ACTIVE", isDeleted: true } as never)).toBe(false);
  });

  it("builds auth token payloads and user full names", () => {
    const user = {
      _id: { toString: () => "user-1" },
      role: "ADMIN",
      privileges: ["*"],
      username: "admin",
      firstName: "Dana",
      lastName: "Levi",
    };

    expect(buildAuthTokenPayload(user as never)).toEqual({
      userId: "user-1",
      role: "ADMIN",
      privileges: ["*"],
      username: "admin",
      fullName: "Dana Levi",
    });
    expect(buildUserFullName({ firstName: "Dana", lastName: "Levi" } as never)).toBe(
      "Dana Levi",
    );
  });

  it("returns undefined when there are no refresh tokens", async () => {
    await expect(
      findMatchingRefreshToken({ refreshTokens: [] } as never, "raw"),
    ).resolves.toBeUndefined();
  });

  it("finds the first non-expired matching refresh token", async () => {
    const expired = {
      tokenHash: "expired-hash",
      expiresAt: new Date("2026-04-18T00:00:00.000Z"),
    };
    const valid = {
      tokenHash: "valid-hash",
      expiresAt: new Date("2999-04-18T00:00:00.000Z"),
    };
    compareMock.mockResolvedValue(true);

    await expect(
      findMatchingRefreshToken(
        { refreshTokens: [expired, valid] } as never,
        "raw-token",
      ),
    ).resolves.toBe(valid as never);

    expect(compareMock).toHaveBeenCalledTimes(1);
    expect(compareMock).toHaveBeenCalledWith("raw-token", "valid-hash");
  });

  it("returns undefined when no refresh token matches", async () => {
    compareMock.mockResolvedValue(false);

    await expect(
      findMatchingRefreshToken(
        {
          refreshTokens: [
            {
              tokenHash: "hash-1",
              expiresAt: new Date("2999-04-18T00:00:00.000Z"),
            },
          ],
        } as never,
        "raw-token",
      ),
    ).resolves.toBeUndefined();
  });
});
