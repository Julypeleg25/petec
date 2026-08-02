import { jest } from "@jest/globals";
import { Types } from "mongoose";
import type { EditPatientDTO } from "@petec/shared";

const findUserMock = jest.fn<() => Promise<any>>();
const buildContextMock = jest.fn<() => Promise<any>>();
const getCandidateDataVersionMock = jest.fn<() => Promise<string>>();
const loadCandidatesMock = jest.fn<() => Promise<any[]>>();
const validateCandidateMock = jest.fn<() => Promise<any>>();
const calculateDetailsMock = jest.fn<() => Promise<any>>();

jest.unstable_mockModule(
  "../../../src/repositories/user/user.repository.js",
  () => ({
    userRepository: { findById: findUserMock },
  }),
);
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
  "../../../src/services/caseSuggestion/handlers/index.js",
  () => ({
    getSuggestionHandler: () => ({
      loadCandidates: loadCandidatesMock,
      validateCandidate: validateCandidateMock,
      calculateDetails: calculateDetailsMock,
    }),
  }),
);

const { CaseSuggestionSaveValidationService, CaseSuggestionStaleError } =
  await import("../../../src/services/caseSuggestion/caseSuggestionSaveValidation.service.js");

const patientId = new Types.ObjectId().toString();
const medicineId = new Types.ObjectId().toString();
const routeId = new Types.ObjectId().toString();
const frequencyId = new Types.ObjectId().toString();
const version = new Date("2026-07-01T10:00:00.000Z").toISOString();
const candidateDataVersion = new Date(
  "2026-07-01T11:00:00.000Z",
).toISOString();

const buildDto = (doseAmount = 20): EditPatientDTO => ({
  caseId: "1000",
  caseDetails: [
    [
      {
        date: "2026-07-01",
        time: "08:00",
        index: 0,
        fluids: [],
        medicines: [
          {
            medicineId,
            doseAmount,
            routeOfAdministrationId: routeId,
            dosageFrequencyId: frequencyId,
            isRequired: false,
            isEditable: true,
            suggestionReference: {
              suggestionId: "61d6d64d-c40e-41fe-a95f-1914cb713c52",
              category: "medication",
              itemId: medicineId,
              patientDataVersion: version,
              candidateDataVersion,
              generatedAt: version,
            },
          },
        ],
        procedures: [],
        examinations: [],
        foodExtras: [],
      },
    ],
  ],
});

const existingCase = {
  updatedAt: new Date(version),
  patientSnapshot: { weightKg: 10 },
  refs: {},
  admission: {},
  flags: {},
};

describe("CaseSuggestionSaveValidationService", () => {
  const service = new CaseSuggestionSaveValidationService();

  beforeEach(() => {
    jest.clearAllMocks();
    findUserMock.mockResolvedValue({ role: "DOCTOR" });
    buildContextMock.mockResolvedValue({ patientDataVersion: version });
    getCandidateDataVersionMock.mockResolvedValue(candidateDataVersion);
    loadCandidatesMock.mockResolvedValue([
      {
        category: "medication",
        itemId: medicineId,
        displayName: "Test medicine",
        authoritativeValues: {
          category: "medication",
          medicationId: medicineId,
        },
        sourceData: {},
      },
    ]);
    validateCandidateMock.mockResolvedValue({ blockingIssues: [] });
    calculateDetailsMock.mockResolvedValue({
      category: "medication",
      medicationId: medicineId,
      doseAmount: 20,
      routeOfAdministrationId: routeId,
      dosageFrequencyId: frequencyId,
    });
  });

  it("accepts a current suggestion after revalidation and recalculation", async () => {
    await expect(
      service.validate(buildDto(), existingCase as never, patientId, "user-1"),
    ).resolves.toBeUndefined();

    expect(loadCandidatesMock).toHaveBeenCalledTimes(1);
    expect(validateCandidateMock).toHaveBeenCalledTimes(1);
    expect(calculateDetailsMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a changed patient-data version with the required conflict code", async () => {
    buildContextMock.mockResolvedValue({
      patientDataVersion: new Date("2026-07-02T10:00:00.000Z").toISOString(),
    });

    await expect(
      service.validate(buildDto(), existingCase as never, patientId, "user-1"),
    ).rejects.toBeInstanceOf(CaseSuggestionStaleError);
  });

  it("rejects submitted values that differ from authoritative recalculation", async () => {
    await expect(
      service.validate(
        buildDto(999),
        existingCase as never,
        patientId,
        "user-1",
      ),
    ).rejects.toBeInstanceOf(CaseSuggestionStaleError);
  });

  it("rejects added medicine fields that were not in the recalculated suggestion", async () => {
    const dto = buildDto();
    const medicine = dto.caseDetails?.[0]?.[0]?.medicines[0];
    if (!medicine) throw new Error("Missing medicine test fixture");
    medicine.dosageText = "ערך ששונה לאחר יצירת ההצעה";

    await expect(
      service.validate(dto, existingCase as never, patientId, "user-1"),
    ).rejects.toBeInstanceOf(CaseSuggestionStaleError);
  });

  it("rejects removed or version-changed source entries", async () => {
    loadCandidatesMock.mockResolvedValue([]);

    await expect(
      service.validate(buildDto(), existingCase as never, patientId, "user-1"),
    ).rejects.toBeInstanceOf(CaseSuggestionStaleError);
  });
});
