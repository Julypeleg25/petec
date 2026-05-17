import { BulkTemplateUploadResponseDTOSchema, HttpStatus } from "@petec/shared";
import { jest } from "@jest/globals";
import { BadRequestError } from "../../../src/constants/error.constants.js";

const downloadTemplateMock = jest.fn<(...args: any[]) => Promise<Buffer>>();
const uploadTemplateMock = jest.fn<(...args: any[]) => Promise<number>>();
const sendSuccessMock = jest.fn<(...args: any[]) => void>();
const getValidatedBodyMock = jest.fn<(req: any) => any>();
const getValidatedParamsMock = jest.fn<(req: any) => any>();

jest.unstable_mockModule("../../../src/services/admin/index.js", () => ({
  bulkTemplateService: {
    downloadTemplate: downloadTemplateMock,
    uploadTemplate: uploadTemplateMock,
  },
}));

jest.unstable_mockModule("../../../src/utils/apiResponse.js", () => ({
  sendSuccess: sendSuccessMock,
}));

jest.unstable_mockModule("../../../src/utils/request.utils.js", () => ({
  getValidatedBody: getValidatedBodyMock,
  getValidatedParams: getValidatedParamsMock,
}));

const { BulkTemplateController } = await import(
  "../../../src/controllers/admin/bulkTemplate.controller.js"
);

describe("BulkTemplateController", () => {
  const controller = new BulkTemplateController();
  const next = jest.fn<(err?: unknown) => void>();

  beforeEach(() => {
    downloadTemplateMock.mockReset();
    uploadTemplateMock.mockReset();
    sendSuccessMock.mockReset();
    getValidatedBodyMock.mockReset();
    getValidatedParamsMock.mockReset();
    next.mockReset();
  });

  it("downloads CSV templates with attachment headers", async () => {
    const csvBuffer = Buffer.from("name\nvalue");
    const res = {
      setHeader: jest.fn<(...args: any[]) => void>(),
      status: jest.fn(function mockStatus(this: any) {
        return this;
      }),
      end: jest.fn<(...args: any[]) => void>(),
    } as never;

    getValidatedBodyMock.mockReturnValue({ systemType: "medicines" });
    downloadTemplateMock.mockResolvedValue(csvBuffer);

    await controller.downloadTemplate({ body: {} } as never, res, next);

    expect(downloadTemplateMock).toHaveBeenCalledWith("medicines");
    expect((res as any).setHeader).toHaveBeenNthCalledWith(
      1,
      "Content-Type",
      "text/csv; charset=utf-8",
    );
    expect((res as any).setHeader).toHaveBeenNthCalledWith(
      2,
      "Content-Disposition",
      'attachment; filename="medicines_template.csv"',
    );
    expect((res as any).setHeader).toHaveBeenNthCalledWith(
      3,
      "Content-Length",
      csvBuffer.length,
    );
    expect((res as any).status).toHaveBeenCalledWith(HttpStatus.OK);
    expect((res as any).end).toHaveBeenCalledWith(csvBuffer);
  });

  it("uploads CSV templates and returns the created count", async () => {
    const res = {} as never;
    getValidatedParamsMock.mockReturnValue({ systemType: "medicines" });
    uploadTemplateMock.mockResolvedValue(4);

    await controller.uploadTemplate(
      {
        params: {},
        file: {
          buffer: Buffer.from("name\nvalue"),
        },
      } as never,
      res,
      next,
    );

    expect(uploadTemplateMock).toHaveBeenCalledWith(
      "medicines",
      expect.any(Buffer),
    );
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      { created: 4 },
      BulkTemplateUploadResponseDTOSchema,
    );
  });

  it("rejects uploads without a CSV file", async () => {
    getValidatedParamsMock.mockReturnValue({ systemType: "medicines" });

    await controller.uploadTemplate(
      {
        params: {},
      } as never,
      {} as never,
      next,
    );

    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(BadRequestError);
    expect((error as Error).message).toBe("CSV file is required");
    expect(uploadTemplateMock).not.toHaveBeenCalled();
  });

  it("forwards download failures to next", async () => {
    const error = new Error("download failed");
    const res = {
      setHeader: jest.fn(),
      status: jest.fn(),
      end: jest.fn(),
    } as never;
    getValidatedBodyMock.mockReturnValue({ systemType: "medicines" });
    downloadTemplateMock.mockRejectedValue(error);

    await controller.downloadTemplate({ body: {} } as never, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
