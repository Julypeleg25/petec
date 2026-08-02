import { jest } from "@jest/globals";
import { Types } from "mongoose";

const buildContextMock = jest.fn<() => Promise<any>>();
const getCandidateDataVersionMock = jest.fn<() => Promise<string>>();
const getSupportMock = jest.fn<() => Promise<ReadonlyMap<string, any>>>();
const loadCandidatesMock = jest.fn<() => Promise<any[]>>();
const validateCandidateMock = jest.fn<(candidate: any) => Promise<any>>();
const calculateDetailsMock = jest.fn<(candidate: any) => Promise<any>>();
const rankCandidateMock = jest.fn<() => any>();
const rateLimitRunMock = jest.fn<(...args: any[]) => Promise<any>>();
const aiRankMock = jest.fn<() => Promise<ReadonlyMap<string, number> | null>>();
const infoMock = jest.fn();
const warnMock = jest.fn();
const errorMock = jest.fn();

const testEnv = { aiCaseSuggestionsEnabled: true };

jest.unstable_mockModule("../../../src/config/config.js", () => ({
  ENV: testEnv,
}));
jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: { info: infoMock, warn: warnMock, error: errorMock },
}));
jest.unstable_mockModule(
  "../../../src/services/caseSuggestion/caseSuggestionContext.service.js",
  () => ({ caseSuggestionContextService: { build: buildContextMock } }),
);
jest.unstable_mockModule(
  "../../../src/repositories/caseSuggestion/index.js",
  () => ({
    caseSuggestionCandidateDataRepository: {
      getVersion: getCandidateDataVersionMock,
    },
  }),
);
jest.unstable_mockModule(
  "../../../src/services/caseSuggestion/caseSuggestionHistory.service.js",
  () => ({ caseSuggestionHistoryService: { getSupport: getSupportMock } }),
);
jest.unstable_mockModule(
  "../../../src/services/caseSuggestion/caseSuggestionRateLimit.service.js",
  () => ({ caseSuggestionRateLimitService: { run: rateLimitRunMock } }),
);
jest.unstable_mockModule(
  "../../../src/services/caseSuggestion/caseSuggestionAiRanking.service.js",
  () => ({ caseSuggestionAiRankingService: { rank: aiRankMock } }),
);
jest.unstable_mockModule(
  "../../../src/services/caseSuggestion/handlers/index.js",
  () => ({
    getSuggestionHandler: () => ({
      category: "medication",
      loadCandidates: loadCandidatesMock,
      validateCandidate: validateCandidateMock,
      calculateDetails: calculateDetailsMock,
      rankCandidate: rankCandidateMock,
    }),
  }),
);

const { CaseSuggestionService } =
  await import("../../../src/services/caseSuggestion/caseSuggestion.service.js");

const patientId = new Types.ObjectId().toString();
const patientDataVersion = "2026-07-02T10:00:00.000Z";
const candidateDataVersion = "2026-07-01T10:00:00.000Z";

const buildCandidate = (index: number) => {
  const itemId = new Types.ObjectId().toString();
  return {
    category: "medication" as const,
    itemId,
    displayName: `Test item ${index}`,
    sourceData: {},
    authoritativeValues: {
      category: "medication" as const,
      medicationId: itemId,
      doseAmount: index + 1,
    },
  };
};

describe("CaseSuggestionService", () => {
  const service = new CaseSuggestionService();

  beforeEach(() => {
    jest.clearAllMocks();
    testEnv.aiCaseSuggestionsEnabled = true;
    rateLimitRunMock.mockImplementation(
      async (_userId, _patientId, _category, operation) => operation(),
    );
    buildContextMock.mockResolvedValue({
      patientId,
      caseId: new Types.ObjectId().toString(),
      patientDataVersion,
      allergyStatus: "absent",
      flags: {},
      activeMedicationIds: new Set(),
      activeFluidIds: new Set(),
      activeProcedureIds: new Set(),
      pendingDiagnosticTestIds: new Set(),
      activeNutritionIds: new Set(),
      latestVitals: {},
    });
    getCandidateDataVersionMock.mockResolvedValue(candidateDataVersion);
    rankCandidateMock.mockReturnValue({ finalScore: 10 });
    aiRankMock.mockResolvedValue(null);
    validateCandidateMock.mockResolvedValue({
      warnings: [],
      blockingIssues: [],
      missingInformation: [],
    });
    calculateDetailsMock.mockImplementation(
      async (candidate) => candidate.authoritativeValues,
    );
  });

  it("filters blocked candidates and limits results to five", async () => {
    const candidates = Array.from({ length: 7 }, (_, index) =>
      buildCandidate(index),
    );
    loadCandidatesMock.mockResolvedValue(candidates);
    getSupportMock.mockResolvedValue(
      new Map(
        candidates.map((candidate) => [
          candidate.itemId,
          { similarCaseCount: 1 },
        ]),
      ),
    );
    validateCandidateMock.mockImplementation(async (candidate) => ({
      warnings: [],
      blockingIssues: candidate === candidates[6] ? ["blocked"] : [],
      missingInformation: [],
    }));

    const result = await service.generate(patientId, "medication", {}, {
      userId: "user-1",
      role: "DOCTOR",
    });

    expect(result.suggestions).toHaveLength(5);
    expect(result.suggestions.map((item) => item.itemId)).not.toContain(
      candidates[6].itemId,
    );
  });

  it("returns only candidates supported by similar completed cases", async () => {
    const supported = buildCandidate(0);
    const unsupported = buildCandidate(1);
    loadCandidatesMock.mockResolvedValue([supported, unsupported]);
    getSupportMock.mockResolvedValue(
      new Map([
        [supported.itemId, { similarCaseCount: 3 }],
        [unsupported.itemId, { similarCaseCount: 0 }],
      ]),
    );

    const result = await service.generate(patientId, "medication", {}, {
      userId: "user-1",
      role: "DOCTOR",
    });

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].itemId).toBe(supported.itemId);
  });

  it("uses Groq scores to reorder prevalidated historical candidates", async () => {
    const first = buildCandidate(0);
    const second = buildCandidate(1);
    loadCandidatesMock.mockResolvedValue([first, second]);
    getSupportMock.mockResolvedValue(
      new Map([
        [first.itemId, { similarCaseCount: 5 }],
        [second.itemId, { similarCaseCount: 1 }],
      ]),
    );
    aiRankMock.mockResolvedValue(
      new Map([
        [first.itemId, 20],
        [second.itemId, 90],
      ]),
    );

    const result = await service.generate(patientId, "medication", {}, {
      userId: "user-1",
      role: "DOCTOR",
    });

    expect(result.suggestions.map((item) => item.itemId)).toEqual([
      second.itemId,
      first.itemId,
    ]);
  });

  it("returns a safe empty response when no active candidates exist", async () => {
    loadCandidatesMock.mockResolvedValue([]);

    const result = await service.generate(patientId, "medication", {}, {
      userId: "user-1",
      role: "DOCTOR",
    });

    expect(result.status).toBe("insufficient_information");
    expect(result.suggestions).toEqual([]);
    expect(getSupportMock).not.toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalled();
  });

  it("does not generate suggestions when the feature is disabled", async () => {
    testEnv.aiCaseSuggestionsEnabled = false;

    const result = await service.generate(patientId, "medication", {}, {
      userId: "user-1",
      role: "DOCTOR",
    });

    expect(result.status).toBe("disabled");
    expect(loadCandidatesMock).not.toHaveBeenCalled();
  });

  it("isolates and logs a candidate calculation failure", async () => {
    const failed = buildCandidate(0);
    const valid = buildCandidate(1);
    loadCandidatesMock.mockResolvedValue([failed, valid]);
    getSupportMock.mockResolvedValue(
      new Map([
        [failed.itemId, { similarCaseCount: 1 }],
        [valid.itemId, { similarCaseCount: 1 }],
      ]),
    );
    calculateDetailsMock.mockImplementation(async (candidate) => {
      if (candidate === failed) throw new Error("invalid candidate");
      return candidate.authoritativeValues;
    });

    const result = await service.generate(patientId, "medication", {}, {
      userId: "user-1",
      role: "DOCTOR",
    });

    expect(result.suggestions.map((item) => item.itemId)).toEqual([
      valid.itemId,
    ]);
    expect(errorMock).toHaveBeenCalled();
  });
});
