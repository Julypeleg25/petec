import { jest } from "@jest/globals";
import { Types } from "mongoose";
import type { AuthoritativeSuggestionValues } from "@petec/shared";
import { systemTypesRepository } from "../../../src/repositories/admin/systemTypes.repository.js";
import type {
  LoadedSuggestionCandidate,
  PatientSuggestionContext,
} from "../../../src/services/caseSuggestion/caseSuggestion.types.js";
import {
  DiagnosticTestSuggestionHandler,
  MedicationSuggestionHandler,
  NutritionSuggestionHandler,
  ProcedureSuggestionHandler,
} from "../../../src/services/caseSuggestion/handlers/index.js";

const medicineId = new Types.ObjectId().toString();
const routeId = new Types.ObjectId().toString();
const frequencyId = new Types.ObjectId().toString();

const buildContext = (
  overrides: Partial<PatientSuggestionContext> = {},
): PatientSuggestionContext => ({
  patientId: new Types.ObjectId().toString(),
  caseId: new Types.ObjectId().toString(),
  patientDataVersion: new Date().toISOString(),
  animalTypeId: new Types.ObjectId().toString(),
  ageMonths: 48,
  weightKg: 10,
  hospitalizationReason: "Pain and loss of appetite",
  allergyStatus: "absent",
  flags: {},
  activeMedicationIds: new Set(),
  activeFluidIds: new Set(),
  activeProcedureIds: new Set(),
  pendingDiagnosticTestIds: new Set(),
  activeNutritionIds: new Set(),
  latestVitals: {},
  ...overrides,
});

const buildCandidate = (
  authoritativeValues: AuthoritativeSuggestionValues,
  sourceData: Readonly<Record<string, unknown>> = {},
): LoadedSuggestionCandidate => {
  const itemId =
    authoritativeValues.category === "medication"
      ? authoritativeValues.medicationId
      : authoritativeValues.category === "fluid"
        ? authoritativeValues.fluidId
        : authoritativeValues.category === "procedure"
          ? authoritativeValues.procedureId
          : authoritativeValues.category === "diagnostic_test"
            ? authoritativeValues.testId
            : authoritativeValues.category === "nutrition"
              ? authoritativeValues.nutritionItemId
              : new Types.ObjectId().toString();

  return {
    category: authoritativeValues.category,
    itemId,
    displayName: "Test item",
    authoritativeValues,
    sourceData,
  };
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("case suggestion category handlers", () => {
  it("calculates medication doses from existing per-weight values", async () => {
    const handler = new MedicationSuggestionHandler();
    const candidate = buildCandidate(
      {
        category: "medication",
        medicationId: medicineId,
        routeOfAdministrationId: routeId,
        dosageFrequencyId: frequencyId,
      },
      { rangeMin: 2, rangeMax: 4 },
    );

    const validation = await handler.validateCandidate(
      candidate,
      buildContext(),
    );
    const values = await handler.calculateDetails(candidate, buildContext());

    expect(validation.blockingIssues).toEqual([]);
    expect(values).toMatchObject({
      category: "medication",
      medicationId: medicineId,
      doseAmount: 30,
    });
  });

  it("blocks medication suggestions when allergy status is unknown", async () => {
    const handler = new MedicationSuggestionHandler();
    const candidate = buildCandidate(
      {
        category: "medication",
        medicationId: medicineId,
        routeOfAdministrationId: routeId,
        dosageFrequencyId: frequencyId,
      },
      { totalDose: 10 },
    );

    const validation = await handler.validateCandidate(
      candidate,
      buildContext({ allergyStatus: "unknown" }),
    );

    expect(validation.missingInformation).toContain("allergies");
  });

  it("blocks invalid existing calculation ranges", async () => {
    const handler = new MedicationSuggestionHandler();
    const candidate = buildCandidate(
      {
        category: "medication",
        medicationId: medicineId,
        routeOfAdministrationId: routeId,
        dosageFrequencyId: frequencyId,
      },
      { rangeMin: 5, rangeMax: 2 },
    );

    const validation = await handler.validateCandidate(
      candidate,
      buildContext(),
    );

    expect(validation.blockingIssues).toContain(
      "נתוני החישוב של הפריט אינם תקינים",
    );
  });

  it("blocks duplicate procedures and pending diagnostic tests", async () => {
    const procedureId = new Types.ObjectId().toString();
    const testId = new Types.ObjectId().toString();
    const procedure = buildCandidate({ category: "procedure", procedureId });
    const diagnostic = buildCandidate({
      category: "diagnostic_test",
      testId,
    });

    const procedureValidation =
      await new ProcedureSuggestionHandler().validateCandidate(
        procedure,
        buildContext({ activeProcedureIds: new Set([procedureId]) }),
      );
    const diagnosticValidation =
      await new DiagnosticTestSuggestionHandler().validateCandidate(
        diagnostic,
        buildContext({ pendingDiagnosticTestIds: new Set([testId]) }),
      );

    expect(procedureValidation.blockingIssues).toContain(
      "הפרוצדורה כבר קיימת בתוכנית הפעילה",
    );
    expect(diagnosticValidation.blockingIssues).toContain(
      "הבדיקה כבר ממתינה לתוצאה",
    );
  });

  it.each([
    ["procedure", new ProcedureSuggestionHandler(), "procedureId"],
    ["diagnostic_test", new DiagnosticTestSuggestionHandler(), "testId"],
    ["nutrition", new NutritionSuggestionHandler(), "nutritionItemId"],
  ] as const)(
    "loads active %s candidates directly from existing selector data",
    async (category, handler, itemIdKey) => {
      const itemId = new Types.ObjectId();
      const sourceItem = { _id: itemId, name: "Existing item" };
      const exec = jest.fn<() => Promise<(typeof sourceItem)[]>>()
        .mockResolvedValue([sourceItem]);
      const lean = jest.fn(() => ({ exec }));
      const sort = jest.fn(() => ({ lean }));
      const find = jest.fn(() => ({ sort }));
      jest
        .spyOn(systemTypesRepository, "getModel")
        .mockReturnValue({ find } as never);

      const [candidate] = await handler.loadCandidates();

      expect(candidate).toMatchObject({
        category,
        itemId: itemId.toString(),
        displayName: sourceItem.name,
        authoritativeValues: {
          category,
          [itemIdKey]: itemId.toString(),
        },
      });
    },
  );

  it("uses history as a bounded ranking contribution", async () => {
    const handler = new MedicationSuggestionHandler();
    const candidate = buildCandidate(
      {
        category: "medication",
        medicationId: medicineId,
        routeOfAdministrationId: routeId,
        dosageFrequencyId: frequencyId,
      },
      { totalDose: 10 },
    );
    const validation = await handler.validateCandidate(
      candidate,
      buildContext(),
    );

    const withoutHistory = handler.rankCandidate(
      candidate,
      buildContext(),
      validation,
      { similarCaseCount: 0 },
    );
    const withHistory = handler.rankCandidate(
      candidate,
      buildContext(),
      validation,
      { similarCaseCount: 100 },
    );

    expect(withHistory.finalScore - withoutHistory.finalScore).toBe(20);
  });
});
