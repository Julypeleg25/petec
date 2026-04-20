import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { jest } from "@jest/globals";
import { ValidationError } from "../../../src/constants/error.constants.js";

const findAllMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const findByNameIncludingDeletedMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const createMock = jest.fn<(...args: any[]) => Promise<any>>();
const parseBulkTemplateCsvLineMock = jest.fn<(line: string) => any>();
const toBulkTemplateCsvRowMock = jest.fn<(item: any) => string>();
const infoMock = jest.fn<(...args: any[]) => void>();

jest.unstable_mockModule("../../../src/repositories/admin/index.js", () => ({
  systemTypesRepository: {
    findAll: findAllMock,
    findByNameIncludingDeleted: findByNameIncludingDeletedMock,
    create: createMock,
  },
}));

jest.unstable_mockModule("../../../src/services/admin/utils/index.js", () => ({
  BULK_TEMPLATE_CSV: {
    HEADER: "name,isDeleted",
    LINE_BREAK: "\n",
    MIN_LINES_WITH_HEADER: 2,
    ENCODING: "utf-8",
  },
  parseBulkTemplateCsvLine: parseBulkTemplateCsvLineMock,
  toBulkTemplateCsvRow: toBulkTemplateCsvRowMock,
}));

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
  },
}));

const { BulkTemplateService } = await import(
  "../../../src/services/admin/bulkTemplateService.js"
);

const createDoc = (data: any) => ({
  toObject: jest.fn(() => data),
});

describe("BulkTemplateService", () => {
  const service = new BulkTemplateService();

  beforeEach(() => {
    findAllMock.mockReset();
    findByNameIncludingDeletedMock.mockReset();
    createMock.mockReset();
    parseBulkTemplateCsvLineMock.mockReset();
    toBulkTemplateCsvRowMock.mockReset();
    infoMock.mockReset();
  });

  it("downloads templates as CSV buffers and logs the result", async () => {
    const docs = [
      createDoc({ name: "IV", isDeleted: false }),
      createDoc({ name: "Oral", isDeleted: true }),
    ];
    findAllMock.mockResolvedValue(docs);
    toBulkTemplateCsvRowMock.mockReturnValueOnce("IV,false").mockReturnValueOnce(
      "Oral,true",
    );

    const buffer = await service.downloadTemplate(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    );

    expect(buffer.toString("utf-8")).toBe("name,isDeleted\nIV,false\nOral,true");
    expect(findAllMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    );
    expect(infoMock).toHaveBeenCalledWith("Bulk template downloaded", {
      module: "bulkTemplate",
      event: "admin_bulk_template_downloaded",
      type_name: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      row_count: 2,
    });
  });

  it("rejects CSV uploads with fewer than a header and one data row", async () => {
    await expect(
      service.uploadTemplate(
        SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
        Buffer.from("name,isDeleted", "utf-8"),
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("rejects CSV uploads when all parsed rows are invalid", async () => {
    parseBulkTemplateCsvLineMock.mockReturnValue(null);

    await expect(
      service.uploadTemplate(
        SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
        Buffer.from("name,isDeleted\n,\n", "utf-8"),
      ),
    ).rejects.toThrow("No valid rows found in CSV");

    expect(parseBulkTemplateCsvLineMock.mock.calls[0]?.[0]).toBe(",");
  });

  it("rejects uploads when a parsed row already exists", async () => {
    parseBulkTemplateCsvLineMock.mockReturnValue({ name: "IV", isDeleted: false });
    findByNameIncludingDeletedMock.mockResolvedValue({ _id: "existing-1" });

    await expect(
      service.uploadTemplate(
        SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
        Buffer.from("name,isDeleted\nIV,false", "utf-8"),
      ),
    ).rejects.toThrow('Cannot create "IV": a record with this name already exists');

    expect(findByNameIncludingDeletedMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      "IV",
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates each parsed row and returns the created count", async () => {
    parseBulkTemplateCsvLineMock
      .mockReturnValueOnce({ name: "IV", isDeleted: false })
      .mockReturnValueOnce({ name: "Oral", isDeleted: true });
    findByNameIncludingDeletedMock.mockResolvedValue(null);
    createMock.mockResolvedValue({});

    await expect(
      service.uploadTemplate(
        SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
        Buffer.from("name,isDeleted\nIV,false\n\nOral,true", "utf-8"),
      ),
    ).resolves.toBe(2);

    expect(createMock).toHaveBeenNthCalledWith(
      1,
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      { name: "IV", isDeleted: false },
    );
    expect(createMock).toHaveBeenNthCalledWith(
      2,
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      { name: "Oral", isDeleted: true },
    );
    expect(infoMock).toHaveBeenCalledWith("Bulk template uploaded", {
      module: "bulkTemplate",
      event: "admin_bulk_template_uploaded",
      type_name: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      total_rows: 2,
      created: 2,
    });
  });
});
