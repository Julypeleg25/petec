import { PATIENT_CARD_TABLE_NAMES, TABLE_ALLOW_LIST } from "@petec/shared";
import { jest } from "@jest/globals";

const ensureAllowedTableNameMock = jest.fn<(...args: any[]) => void>();
const resolveTableHandlerMock = jest.fn<(...args: any[]) => any>();
const buildPaginatedTableResponseMock = jest.fn<(...args: any[]) => any>();
const patientCardsGetTableDataMock = jest.fn<(...args: any[]) => Promise<any>>();

const tableHandlers = { medicines: Symbol("medicines-handler") };

jest.unstable_mockModule("../../../src/mappers/table/table.mappers.js", () => ({
  TABLE_HANDLERS: tableHandlers,
}));

jest.unstable_mockModule("../../../src/mappers/table/table.service.mappers.js", () => ({
  ensureAllowedTableName: ensureAllowedTableNameMock,
  resolveTableHandler: resolveTableHandlerMock,
  buildPaginatedTableResponse: buildPaginatedTableResponseMock,
}));

jest.unstable_mockModule("../../../src/services/table/index.js", () => ({
  patientCardsTableService: {
    getTableData: patientCardsGetTableDataMock,
  },
}));

const { TableService } = await import("../../../src/services/table/tableService.js");

describe("TableService", () => {
  const service = new TableService();

  beforeEach(() => {
    ensureAllowedTableNameMock.mockReset();
    resolveTableHandlerMock.mockReset();
    buildPaginatedTableResponseMock.mockReset();
    patientCardsGetTableDataMock.mockReset();
  });

  it("delegates patient-card tables to the patient cards service", async () => {
    const tableName = PATIENT_CARD_TABLE_NAMES[0];
    const filters = { archived: false };
    const paginated = { items: [{ id: "row-1" }], total: 1 };

    patientCardsGetTableDataMock.mockResolvedValue(paginated);

    await expect(
      service.getTableData(tableName, filters, 2, 25, "updatedAt", "desc"),
    ).resolves.toBe(paginated);

    expect(ensureAllowedTableNameMock).toHaveBeenCalledWith(
      tableName,
      expect.any(Set),
    );
    const allowedNames = ensureAllowedTableNameMock.mock.calls[0][1] as Set<string>;
    expect(new Set(TABLE_ALLOW_LIST)).toEqual(allowedNames);
    expect(patientCardsGetTableDataMock).toHaveBeenCalledWith(
      tableName,
      filters,
      2,
      25,
      "updatedAt",
      "desc",
    );
    expect(resolveTableHandlerMock).not.toHaveBeenCalled();
    expect(buildPaginatedTableResponseMock).not.toHaveBeenCalled();
  });

  it("resolves generic table handlers and builds paginated responses", async () => {
    const tableName = TABLE_ALLOW_LIST.find(
      (name) => !PATIENT_CARD_TABLE_NAMES.includes(name as (typeof PATIENT_CARD_TABLE_NAMES)[number]),
    );

    if (!tableName) {
      throw new Error("Expected a non-patient-card table name in TABLE_ALLOW_LIST");
    }

    const handler = {
      find: jest
        .fn<(...args: any[]) => Promise<any[]>>()
        .mockResolvedValue([{ id: "row-1" }, { id: "row-2" }]),
      count: jest.fn<(...args: any[]) => Promise<number>>().mockResolvedValue(17),
    };
    const response = { items: [{ id: "row-1" }], total: 17, page: 3, limit: 10 };

    resolveTableHandlerMock.mockReturnValue(handler);
    buildPaginatedTableResponseMock.mockReturnValue(response);

    await expect(
      service.getTableData(tableName, { type: "active" }, 3, 10, "name", "asc"),
    ).resolves.toBe(response);

    expect(resolveTableHandlerMock).toHaveBeenCalledWith(tableName, tableHandlers);
    expect(handler.find).toHaveBeenCalledWith(
      { type: "active" },
      { page: 3, limit: 10, sortBy: "name", sortOrder: "asc" },
    );
    expect(handler.count).toHaveBeenCalledWith({ type: "active" });
    expect(buildPaginatedTableResponseMock).toHaveBeenCalledWith(
      [{ id: "row-1" }, { id: "row-2" }],
      17,
      3,
      10,
    );
  });
});
