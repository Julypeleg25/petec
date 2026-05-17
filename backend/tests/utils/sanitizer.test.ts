import { maskSensitiveData } from "../../src/utils/sanitizer.js";

describe("sanitizer", () => {
  it("masks sensitive fields recursively", () => {
    expect(
      maskSensitiveData({
        email: "vet@example.com",
        nested: {
          accessToken: "abc",
          profile: {
            phone: "0501234567",
            name: "Milo",
          },
        },
      }),
    ).toEqual({
      email: "***MASKED***",
      nested: {
        accessToken: "***MASKED***",
        profile: {
          phone: "***MASKED***",
          name: "Milo",
        },
      },
    });
  });

  it("masks sensitive keys inside arrays and keeps non-sensitive values intact", () => {
    expect(
      maskSensitiveData([
        {
          authorization: "Bearer 123",
          note: "keep me",
        },
        "plain-value",
        42,
      ]),
    ).toEqual([
      {
        authorization: "***MASKED***",
        note: "keep me",
      },
      "plain-value",
      42,
    ]);
  });

  it("matches sensitive keys case-insensitively", () => {
    expect(
      maskSensitiveData({
        ApiKey: "secret",
        RefreshToken: "refresh",
        ordinary: "safe",
      }),
    ).toEqual({
      ApiKey: "***MASKED***",
      RefreshToken: "***MASKED***",
      ordinary: "safe",
    });
  });
});