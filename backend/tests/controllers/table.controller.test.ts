import {
  PatientCardTableDataResponseDTOSchema,
  SYSTEM_TYPE_NAMES,
  TableDataResponseDTOSchema,
} from "@petec/shared";
import { jest } from "@jest/globals";

const getTableDataMock = jest.fn<(...args: any[]) => Promise<any>>();
const sendSuccessMock = jest.fn<(...args: any[]) => void>();
const getValidatedBodyMock = jest.fn<(req: any) => any>();

jest.unstable_mockModule("../../src/services/table/index.js", () => ({
  tableService: {
    getTableData: getTableDataMock,
  },
}));

jest.unstable_mockModule("../../src/utils/apiResponse.js", () => ({
  sendSuccess: sendSuccessMock,
}));

jest.unstable_mockModule("../../src/utils/request.utils.js", () => ({
  getValidatedBody: getValidatedBodyMock,
}));

const { TableController } = await import("../../src/controllers/table/table.controller.js");

describe("TableController", () => {
  const controller = new TableController();
  const res = {} as never;
  const next = jest.fn<(err?: unknown) => void>();

  beforeEach(() => {
    getTableDataMock.mockReset();
    sendSuccessMock.mockReset();
    getValidatedBodyMock.mockReset();
    next.mockReset();
  });

  it("uses the patient-card response schema for patient tables", async () => {
    const dto = {
      tableName: "patients",
      filters: { archived: false },
      page: 1,
      limit: 20,
      sortBy: "updatedAt",
      sortOrder: "desc",
    };
    const result = { items: [], total: 0 };
    getValidatedBodyMock.mockReturnValue(dto);
    getTableDataMock.mockResolvedValue(result);

    await controller.getTableData({ body: dto } as never, res, next);

    expect(getTableDataMock).toHaveBeenCalledWith(
      "patients",
      dto.filters,
      1,
      20,
      "updatedAt",
      "desc",
    );
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      PatientCardTableDataResponseDTOSchema,
    );
  });

  it("uses the admin medicine schema for medicine tables", async () => {
    const dto = {
      tableName: SYSTEM_TYPE_NAMES.MEDICINES,
      filters: {},
      page: 2,
      limit: 10,
      sortBy: "name",
      sortOrder: "asc",
    };
    const result = { items: [{ id: "med-1" }], total: 1 };
    getValidatedBodyMock.mockReturnValue(dto);
    getTableDataMock.mockResolvedValue(result);

    await controller.getTableData({ body: dto } as never, res, next);

    const schemaArg = sendSuccessMock.mock.calls[0]?.[2];
    expect(schemaArg).not.toBe(PatientCardTableDataResponseDTOSchema);
    expect(schemaArg).not.toBe(TableDataResponseDTOSchema);
  });

  it("uses the generic table response schema for other tables", async () => {
    const dto = {
      tableName: "animal_types",
      filters: {},
      page: 1,
      limit: 5,
      sortBy: "name",
      sortOrder: "asc",
    };
    const result = { items: [{ id: "type-1" }], total: 1 };
    getValidatedBodyMock.mockReturnValue(dto);
    getTableDataMock.mockResolvedValue(result);

    await controller.getTableData({ body: dto } as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      TableDataResponseDTOSchema,
    );
  });

  it("forwards service errors to next", async () => {
    const dto = {
      tableName: "animal_types",
      filters: {},
      page: 1,
      limit: 5,
      sortBy: "name",
      sortOrder: "asc",
    };
    const error = new Error("table failed");
    getValidatedBodyMock.mockReturnValue(dto);
    getTableDataMock.mockRejectedValue(error);

    await controller.getTableData({ body: dto } as never, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
