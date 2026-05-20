import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { jest } from "@jest/globals";

const findByAnimalTypeIdMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const buildAnimalVitalsMapMock = jest.fn<(vitals: any[]) => Record<string, any>>();
const buildCaseAlertSummaryMock = jest.fn<(caseDoc: any, vitalsMap: any) => any>();
const getCaseAnimalTypeIdMock = jest.fn<(caseDoc: any) => string>();

jest.unstable_mockModule("../../../src/repositories/admin/index.js", () => ({
  systemTypesRepository: {
    findByAnimalTypeId: findByAnimalTypeIdMock,
  },
}));

jest.unstable_mockModule("../../../src/utils/animalVitals.utils.js", () => ({
  buildAnimalVitalsMap: buildAnimalVitalsMapMock,
}));

jest.unstable_mockModule(
  "../../../src/services/patient/utils/caseAlertsService.utils.js",
  () => ({
    buildCaseAlertSummary: buildCaseAlertSummaryMock,
    getCaseAnimalTypeId: getCaseAnimalTypeIdMock,
  }),
);

const { CaseAlertsService } = await import(
  "../../../src/services/patient/caseAlertsService.js"
);

const createVitalsDoc = (data: any) => ({
  toObject: jest.fn(() => data),
});

describe("CaseAlertsService", () => {
  const service = new CaseAlertsService();

  beforeEach(() => {
    findByAnimalTypeIdMock.mockReset();
    buildAnimalVitalsMapMock.mockReset();
    buildCaseAlertSummaryMock.mockReset();
    getCaseAnimalTypeIdMock.mockReset();
  });

  it("returns an empty list when there are no cases", async () => {
    await expect(service.attachAlertCounts([])).resolves.toEqual([]);
    expect(findByAnimalTypeIdMock).not.toHaveBeenCalled();
  });

  it("attaches alert counts using de-duplicated animal-type vitals maps", async () => {
    const cases = [{ id: "case-1" }, { id: "case-2" }, { id: "case-3" }];
    getCaseAnimalTypeIdMock.mockImplementation((caseDoc: any) => {
      if (caseDoc.id === "case-1") return "animal-1";
      if (caseDoc.id === "case-2") return "animal-1";
      return "";
    });
    findByAnimalTypeIdMock.mockResolvedValue([
      createVitalsDoc({ name: "Temperature" }),
    ]);
    buildAnimalVitalsMapMock.mockReturnValue({ Temperature: { min: 37, max: 39 } });
    buildCaseAlertSummaryMock
      .mockReturnValueOnce({ total: 2 })
      .mockReturnValueOnce({ total: 1 })
      .mockReturnValueOnce({ total: 0 });

    await expect(service.attachAlertCounts(cases as never)).resolves.toEqual([
      { id: "case-1", numOfAlerts: 2 },
      { id: "case-2", numOfAlerts: 1 },
      { id: "case-3", numOfAlerts: 0 },
    ]);

    expect(findByAnimalTypeIdMock).toHaveBeenCalledTimes(1);
    expect(findByAnimalTypeIdMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
      "animal-1",
    );
    expect(buildAnimalVitalsMapMock).toHaveBeenCalledWith([{ name: "Temperature" }]);
    expect(buildCaseAlertSummaryMock.mock.calls[0]?.[1]).toEqual({
      Temperature: { min: 37, max: 39 },
    });
    expect(buildCaseAlertSummaryMock.mock.calls[2]?.[1]).toEqual({});
  });

  it("returns alert summaries for a single case", async () => {
    const caseDoc = { id: "case-1" };
    getCaseAnimalTypeIdMock.mockReturnValue("animal-1");
    findByAnimalTypeIdMock.mockResolvedValue([
      createVitalsDoc({ name: "Pulse" }),
    ]);
    buildAnimalVitalsMapMock.mockReturnValue({ Pulse: { min: 60, max: 100 } });
    buildCaseAlertSummaryMock.mockReturnValue({ total: 3, items: ["pulse"] });

    await expect(service.getCaseAlertSummary(caseDoc as never)).resolves.toEqual({
      total: 3,
      items: ["pulse"],
    });

    expect(buildCaseAlertSummaryMock).toHaveBeenCalledWith(caseDoc, {
      Pulse: { min: 60, max: 100 },
    });
  });

  it("uses an empty vitals map when a case has no animal type id", async () => {
    const caseDoc = { id: "case-1" };
    getCaseAnimalTypeIdMock.mockReturnValue("");
    buildCaseAlertSummaryMock.mockReturnValue({ total: 0, items: [] });

    await expect(service.getCaseAlertSummary(caseDoc as never)).resolves.toEqual({
      total: 0,
      items: [],
    });

    expect(findByAnimalTypeIdMock).not.toHaveBeenCalled();
    expect(buildCaseAlertSummaryMock).toHaveBeenCalledWith(caseDoc, {});
  });
});
