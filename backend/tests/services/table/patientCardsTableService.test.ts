import { jest } from "@jest/globals";

const mapCaseToPatientCardRowDTOMock = jest.fn<(doc: any) => any>();
const buildPaginatedTableResponseMock = jest.fn<(...args: any[]) => any>();
const buildCasesFilterMock = jest.fn<(...args: any[]) => Promise<any>>();
const extractHasAlertsFilterMock = jest.fn<(filters: any) => boolean>();
const toSkipMock = jest.fn<(page: number, limit: number) => number>();
const toSortRecordMock = jest.fn<(sortBy: string, sortOrder: string) => any>();
const findManyLeanMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const countDocumentsMock = jest.fn<(...args: any[]) => Promise<number>>();
const attachAlertCountsMock = jest.fn<(...args: any[]) => Promise<any[]>>();

jest.unstable_mockModule("../../../src/mappers/table/table.mappers.js", () => ({
  mapCaseToPatientCardRowDTO: mapCaseToPatientCardRowDTOMock,
}));

jest.unstable_mockModule("../../../src/mappers/table/table.service.mappers.js", () => ({
  buildPaginatedTableResponse: buildPaginatedTableResponseMock,
}));

jest.unstable_mockModule("../../../src/mappers/table/table.mappers.utils.js", () => ({
  buildCasesFilter: buildCasesFilterMock,
  extractHasAlertsFilter: extractHasAlertsFilterMock,
  toSkip: toSkipMock,
  toSortRecord: toSortRecordMock,
}));

jest.unstable_mockModule("../../../src/repositories/patient/index.js", () => ({
  caseRepository: {
    findManyLean: findManyLeanMock,
    countDocuments: countDocumentsMock,
  },
}));

jest.unstable_mockModule("../../../src/services/patient/index.js", () => ({
  caseAlertsService: {
    attachAlertCounts: attachAlertCountsMock,
  },
}));

const { PatientCardsTableService } = await import(
  "../../../src/services/table/patientCardsTableService.js"
);

describe("PatientCardsTableService", () => {
  const service = new PatientCardsTableService();

  beforeEach(() => {
    mapCaseToPatientCardRowDTOMock.mockReset();
    buildPaginatedTableResponseMock.mockReset();
    buildCasesFilterMock.mockReset();
    extractHasAlertsFilterMock.mockReset();
    toSkipMock.mockReset();
    toSortRecordMock.mockReset();
    findManyLeanMock.mockReset();
    countDocumentsMock.mockReset();
    attachAlertCountsMock.mockReset();
  });

  it("filters alert-bearing rows in memory when hasAlerts is requested", async () => {
    const baseFilter = { archived: false };
    const docs = [{ id: "case-1" }, { id: "case-2" }, { id: "case-3" }];
    const docsWithAlerts = [
      { id: "case-1", numOfAlerts: 2 },
      { id: "case-2", numOfAlerts: 0 },
      { id: "case-3", numOfAlerts: 1 },
    ];
    const mappedRows = [{ id: "row-3" }];
    const paginated = { items: mappedRows, total: 2, page: 2, limit: 1 };

    extractHasAlertsFilterMock.mockReturnValue(true);
    buildCasesFilterMock.mockResolvedValue(baseFilter);
    toSortRecordMock.mockReturnValue({ updatedAt: -1 });
    toSkipMock.mockReturnValue(1);
    findManyLeanMock.mockResolvedValue(docs);
    attachAlertCountsMock.mockResolvedValue(docsWithAlerts);
    mapCaseToPatientCardRowDTOMock.mockReturnValueOnce(mappedRows[0]);
    buildPaginatedTableResponseMock.mockReturnValue(paginated);

    await expect(
      service.getTableData("patients", { hasAlerts: true }, 2, 1, "updatedAt", "desc"),
    ).resolves.toBe(paginated);

    expect(buildCasesFilterMock).toHaveBeenCalledWith(
      { hasAlerts: true },
      { isProcedure: false },
    );
    expect(findManyLeanMock).toHaveBeenCalledWith(baseFilter, {
      sort: { updatedAt: -1 },
      select: expect.any(String),
      populate: ["patientId"],
    });
    expect(countDocumentsMock).not.toHaveBeenCalled();
    expect(attachAlertCountsMock).toHaveBeenCalledWith(docs);
    expect(mapCaseToPatientCardRowDTOMock.mock.calls[0]?.[0]).toEqual({
      id: "case-3",
      numOfAlerts: 1,
    });
    expect(buildPaginatedTableResponseMock).toHaveBeenCalledWith(
      mappedRows,
      2,
      2,
      1,
    );
  });

  it("paginates directly when hasAlerts is not requested", async () => {
    const baseFilter = { archived: false };
    const docs = [{ id: "case-1" }, { id: "case-2" }];
    const docsWithAlerts = [
      { id: "case-1", numOfAlerts: 1 },
      { id: "case-2", numOfAlerts: 0 },
    ];
    const paginated = { items: [{ id: "row-1" }, { id: "row-2" }], total: 12 };

    extractHasAlertsFilterMock.mockReturnValue(false);
    buildCasesFilterMock.mockResolvedValue(baseFilter);
    toSortRecordMock.mockReturnValue({ serialId: 1 });
    toSkipMock.mockReturnValue(20);
    findManyLeanMock.mockResolvedValue(docs);
    countDocumentsMock.mockResolvedValue(12);
    attachAlertCountsMock.mockResolvedValue(docsWithAlerts);
    mapCaseToPatientCardRowDTOMock
      .mockReturnValueOnce({ id: "row-1" })
      .mockReturnValueOnce({ id: "row-2" });
    buildPaginatedTableResponseMock.mockReturnValue(paginated);

    await expect(
      service.getTableData("cases", { status: "open" }, 3, 10, "serialId", "asc"),
    ).resolves.toBe(paginated);

    expect(buildCasesFilterMock).toHaveBeenCalledWith(
      { status: "open" },
      { isProcedure: true },
    );
    expect(findManyLeanMock).toHaveBeenCalledWith(baseFilter, {
      skip: 20,
      limit: 10,
      sort: { serialId: 1 },
      select: expect.any(String),
      populate: ["patientId"],
    });
    expect(countDocumentsMock).toHaveBeenCalledWith(baseFilter);
    expect(attachAlertCountsMock).toHaveBeenCalledWith(docs);
    expect(buildPaginatedTableResponseMock).toHaveBeenCalledWith(
      [{ id: "row-1" }, { id: "row-2" }],
      12,
      3,
      10,
    );
  });
});
