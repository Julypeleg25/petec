import { jest } from "@jest/globals";
import { Types } from "mongoose";
import type {
  LoadedSuggestionCandidate,
  PatientSuggestionContext,
} from "../../../src/services/caseSuggestion/caseSuggestion.types.js";

const infoMock = jest.fn();
const warnMock = jest.fn();
const errorMock = jest.fn();
const testEnv = {
  groqApiKey: "test-groq-key",
  groqModel: "openai/gpt-oss-20b",
  groqTimeoutMs: 2_000,
};

jest.unstable_mockModule("../../../src/config/config.js", () => ({
  ENV: testEnv,
}));
jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: { info: infoMock, warn: warnMock, error: errorMock },
}));

const { CaseSuggestionAiRankingService } =
  await import("../../../src/services/caseSuggestion/caseSuggestionAiRanking.service.js");

const itemId = new Types.ObjectId().toString();
const candidate: LoadedSuggestionCandidate = {
  category: "medication",
  itemId,
  displayName: "Test medicine",
  authoritativeValues: { category: "medication", medicationId: itemId },
  sourceData: {},
};
const context: PatientSuggestionContext = {
  patientId: new Types.ObjectId().toString(),
  caseId: new Types.ObjectId().toString(),
  patientDataVersion: "2026-08-03T10:00:00.000Z",
  ageMonths: 24,
  weightKg: 8,
  hospitalizationReason:
    "Clinical reason owner@example.com +972 50 123 4567 550e8400-e29b-41d4-a716-446655440000",
  comments: "Private comment that must not be sent",
  allergyStatus: "present",
  allergyDetails: "Private allergy details",
  flags: {},
  activeMedicationIds: new Set(),
  activeFluidIds: new Set(),
  activeProcedureIds: new Set(),
  pendingDiagnosticTestIds: new Set(),
  activeNutritionIds: new Set(),
  latestVitals: { temperature: 39 },
};

const createGroqResponse = (content: unknown, status = 200): Response =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    {
      status,
      headers: { "Content-Type": "application/json", "x-request-id": "req-1" },
    },
  );

describe("CaseSuggestionAiRankingService", () => {
  const service = new CaseSuggestionAiRankingService();

  beforeEach(() => {
    jest.clearAllMocks();
    testEnv.groqApiKey = "test-groq-key";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns a validated allowlisted ranking without sending patient identifiers", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        createGroqResponse({
          rankings: [{ itemId, relevanceScore: 87 }],
        }),
      );

    const rankings = await service.rank(context, [
      { candidate, similarCaseCount: 4, deterministicScore: 8 },
    ]);

    expect(rankings?.get(itemId)).toBe(87);
    const request = fetchMock.mock.calls[0][1];
    const body = JSON.parse(String(request?.body)) as Record<string, unknown>;
    const serializedBody = JSON.stringify(body);
    expect(request?.headers).toMatchObject({
      Authorization: "Bearer test-groq-key",
    });
    expect(serializedBody).not.toContain(context.patientId);
    expect(serializedBody).not.toContain(context.caseId);
    expect(serializedBody).not.toContain(context.comments as string);
    expect(serializedBody).not.toContain(context.allergyDetails as string);
    expect(serializedBody).not.toContain("owner@example.com");
    expect(serializedBody).not.toContain("+972 50 123 4567");
    expect(serializedBody).not.toContain(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(serializedBody).toContain("[redacted]");
    expect(body.response_format).toMatchObject({
      type: "json_schema",
      json_schema: { strict: true },
    });
  });

  it("rejects duplicate or incomplete model output and falls back safely", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      createGroqResponse({
        rankings: [
          { itemId, relevanceScore: 90 },
          { itemId, relevanceScore: 80 },
        ],
      }),
    );
    const secondId = new Types.ObjectId().toString();
    const secondCandidate: LoadedSuggestionCandidate = {
      ...candidate,
      itemId: secondId,
      authoritativeValues: {
        category: "medication",
        medicationId: secondId,
      },
    };

    const rankings = await service.rank(context, [
      { candidate, similarCaseCount: 4, deterministicScore: 8 },
      { candidate: secondCandidate, similarCaseCount: 2, deterministicScore: 4 },
    ]);

    expect(rankings).toBeNull();
    expect(errorMock).toHaveBeenCalledWith(
      "Groq case-suggestion ranking failed; using fallback",
      expect.objectContaining({
        event: "case_suggestion_ai_ranking_failed",
      }),
    );
  });

  it("uses deterministic fallback without making a request when unconfigured", async () => {
    testEnv.groqApiKey = "";
    const fetchMock = jest.spyOn(globalThis, "fetch");

    const rankings = await service.rank(context, [
      { candidate, similarCaseCount: 4, deterministicScore: 8 },
    ]);

    expect(rankings).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalled();
  });
});
