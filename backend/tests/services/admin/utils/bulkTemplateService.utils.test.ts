import {
  BULK_TEMPLATE_CSV,
  parseBulkTemplateCsvLine,
  toBulkTemplateCsvRow,
} from "../../../../src/services/admin/utils/bulkTemplateService.utils.js";

describe("bulkTemplateService.utils", () => {
  it("exposes the csv constants", () => {
    expect(BULK_TEMPLATE_CSV).toEqual({
      HEADER: "name,isDeleted",
      LINE_BREAK: "\n",
      MIN_LINES_WITH_HEADER: 2,
      ENCODING: "utf-8",
    });
  });

  it("serializes a lookup row to csv", () => {
    expect(
      toBulkTemplateCsvRow({
        name: "Analgesic",
        isDeleted: true,
      } as never),
    ).toBe("Analgesic,true");
  });

  it("falls back to blank name and false deleted state", () => {
    expect(toBulkTemplateCsvRow({} as never)).toBe(",false");
  });

  it("parses a valid csv line", () => {
    expect(parseBulkTemplateCsvLine("  Analgesic  , true ")).toEqual({
      name: "Analgesic",
      isDeleted: true,
    });
  });

  it("treats a missing deleted value as false", () => {
    expect(parseBulkTemplateCsvLine("Sedation,false,ignored")).toEqual({
      name: "Sedation",
      isDeleted: false,
    });
  });

  it("rejects invalid csv lines", () => {
    expect(parseBulkTemplateCsvLine("")).toBeNull();
    expect(parseBulkTemplateCsvLine(",true")).toBeNull();
  });
});