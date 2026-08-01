import { withClinicalSummaryLimit, resetClinicalSummaryLimitsForTests } from "../../src/services/clinicalSummary/clinicalSummary.rateLimit.js";

describe("clinical summary rate and concurrency limits", () => {
  beforeEach(() => resetClinicalSummaryLimitsForTests());

  it("rejects duplicate in-flight requests for a user or patient", async () => {
    let finish!: () => void;
    const first = withClinicalSummaryLimit("user-1", "patient-1", () => new Promise<void>((resolve) => { finish = resolve; }));
    await expect(withClinicalSummaryLimit("user-1", "patient-2", async () => undefined)).rejects.toEqual(expect.objectContaining({ statusCode: 429 }));
    await expect(withClinicalSummaryLimit("user-2", "patient-1", async () => undefined)).rejects.toEqual(expect.objectContaining({ statusCode: 429 }));
    finish();
    await first;
  });

  it("allows ten hourly requests and rejects the eleventh", async () => {
    for (let index = 0; index < 10; index += 1) {
      await withClinicalSummaryLimit("user-1", `patient-${index}`, async () => undefined);
    }
    await expect(withClinicalSummaryLimit("user-1", "patient-11", async () => undefined)).rejects.toEqual(expect.objectContaining({ statusCode: 429 }));
  });
});
