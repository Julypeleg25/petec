import { jest } from "@jest/globals";
import { CaseSuggestionRateLimitService } from "../../../src/services/caseSuggestion/caseSuggestionRateLimit.service.js";

const USER_ID = "user-1";
const PATIENT_ID = "patient-1";
const CATEGORY = "medication" as const;
const ONE_HOUR_MS = 60 * 60 * 1000;

describe("CaseSuggestionRateLimitService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-01T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("enforces the hourly limit and accepts requests after expiry", async () => {
    const service = new CaseSuggestionRateLimitService();
    const operation = jest.fn(async () => "ok");

    for (let request = 0; request < 10; request += 1) {
      await expect(
        service.run(USER_ID, PATIENT_ID, CATEGORY, operation),
      ).resolves.toBe("ok");
    }

    await expect(
      service.run(USER_ID, PATIENT_ID, CATEGORY, operation),
    ).rejects.toMatchObject({ statusCode: 429 });

    jest.advanceTimersByTime(ONE_HOUR_MS);
    await expect(
      service.run(USER_ID, PATIENT_ID, CATEGORY, operation),
    ).resolves.toBe("ok");
  });

  it("prevents overlapping requests for the same user", async () => {
    const service = new CaseSuggestionRateLimitService();
    let finishFirstRequest: (() => void) | undefined;
    const firstRequest = service.run(
      USER_ID,
      PATIENT_ID,
      CATEGORY,
      () =>
        new Promise<void>((resolve) => {
          finishFirstRequest = resolve;
        }),
    );

    await expect(
      service.run(USER_ID, "patient-2", CATEGORY, async () => undefined),
    ).rejects.toMatchObject({ statusCode: 429 });

    finishFirstRequest?.();
    await expect(firstRequest).resolves.toBeUndefined();
  });
});
