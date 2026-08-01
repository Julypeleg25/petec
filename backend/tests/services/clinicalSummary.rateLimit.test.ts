import {
  withClinicalSummaryLimit,
  resetClinicalSummaryLimitsForTests,
} from "../../src/services/clinicalSummary/clinicalSummary.rateLimit.js";

describe("clinical summary rate and concurrency limits", () => {
  beforeEach(() => resetClinicalSummaryLimitsForTests());

  it("rejects duplicate in-flight requests for a user or patient", async () => {
    let finish!: () => void;
    const first = withClinicalSummaryLimit(
      { userId: "user-1", patientId: "patient-1" },
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await expect(
      withClinicalSummaryLimit(
        { userId: "user-1", patientId: "patient-2" },
        async () => undefined,
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        statusCode: 429,
        category: "duplicate_request",
      }),
    );
    await expect(
      withClinicalSummaryLimit(
        { userId: "user-2", patientId: "patient-1" },
        async () => undefined,
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        statusCode: 429,
        category: "duplicate_request",
      }),
    );
    finish();
    await first;
  });

  it("allows ten hourly requests and rejects the eleventh", async () => {
    for (let index = 0; index < 10; index += 1) {
      await withClinicalSummaryLimit(
        { userId: "user-1", patientId: `patient-${index}` },
        async () => undefined,
      );
    }
    await expect(
      withClinicalSummaryLimit(
        { userId: "user-1", patientId: "patient-11" },
        async () => undefined,
      ),
    ).rejects.toEqual(
      expect.objectContaining({ statusCode: 429, category: "rate_limit" }),
    );
  });
});
