import { jest } from "@jest/globals";

const validResult = {
  backgroundAndAdmission: "רקע",
  currentClinicalStatus: "מצב",
  importantChangesAndTrends: [], treatmentsAndMedications: [], alerts: [], missingInformationAndFollowUp: [],
  recordUpdatedThrough: "2026-01-01T00:00:00.000Z", inputWasTruncated: false,
};
const input = {
  patient: {}, hospitalization: {}, currentStatus: {}, vitalSigns: [], treatments: [], alerts: {}, pendingItems: [],
  sourceMetadata: { recordUpdatedAt: validResult.recordUpdatedThrough, inputWasTruncated: false },
};

describe("Groq clinical summary provider", () => {
  afterEach(() => jest.restoreAllMocks());

  it("uses the configured model, low temperature, no tools, and strict structured output", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(validResult) } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const { generateGroqClinicalSummary } = await import("../../src/services/clinicalSummary/clinicalSummary.provider.js");
    await expect(generateGroqClinicalSummary(input)).resolves.toEqual(validResult);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.model).toBe("openai/gpt-oss-120b");
    expect(body.temperature).toBe(0.1);
    expect(body.reasoning_effort).toBe("low");
    expect(body.max_completion_tokens).toBe(1200);
    expect(body.tools).toBeUndefined();
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.additionalProperties).toBe(false);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].role).toBe("user");
  });

  it("rejects invalid provider output", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ backgroundAndAdmission: "partial" }) } }],
    }), { status: 200 }));
    const { generateGroqClinicalSummary, ClinicalSummaryProviderError } = await import("../../src/services/clinicalSummary/clinicalSummary.provider.js");
    await expect(generateGroqClinicalSummary(input)).rejects.toEqual(expect.objectContaining<Partial<InstanceType<typeof ClinicalSummaryProviderError>>>({ category: "invalid_output" }));
  });

  it("maps provider rate limits without exposing the provider body", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("secret provider details", { status: 429 }));
    const { generateGroqClinicalSummary } = await import("../../src/services/clinicalSummary/clinicalSummary.provider.js");
    await expect(generateGroqClinicalSummary(input)).rejects.toEqual(expect.objectContaining({ category: "rate_limit" }));
  });

  it("maps provider timeouts to a safe category", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(Object.assign(new Error("timed out with secret"), { name: "AbortError" }));
    const { generateGroqClinicalSummary } = await import("../../src/services/clinicalSummary/clinicalSummary.provider.js");
    await expect(generateGroqClinicalSummary(input)).rejects.toEqual(expect.objectContaining({ category: "timeout" }));
  });

  it("constructs medicine receipt status and alerts from input instead of model wording", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      ...validResult,
      treatmentsAndMedications: ["התרופה שונה"],
      alerts: ["אלרגיה מומצאת"],
    }) } }] }), { status: 200 }));
    const { generateGroqClinicalSummary } = await import("../../src/services/clinicalSummary/clinicalSummary.provider.js");
    const result = await generateGroqClinicalSummary({
      ...input,
      treatments: [
        { name: "תרופה א", administrationStatus: "received", scheduledAt: "2026-01-01T08:00:00.000Z" },
        { name: "תרופה ב", administrationStatus: "not_received_yet", scheduledAt: "2026-01-01T12:00:00.000Z" },
      ],
      alerts: { allergies: ["פניצילין"], other: ["בצום (NPO)"] },
    });
    expect(result.treatmentsAndMedications).toEqual([
      expect.stringMatching(/תרופה א, קיבל\/ה.*10:00/),
      expect.stringMatching(/תרופה ב, טרם קיבל\/ה.*14:00/),
    ]);
    expect(result.treatmentsAndMedications.join(" ")).not.toContain("שונה");
    expect(result.alerts).toEqual(["אלרגיה: פניצילין", "בצום (NPO)"]);
    expect(result.alerts).not.toContain("אלרגיה מומצאת");
  });
});
