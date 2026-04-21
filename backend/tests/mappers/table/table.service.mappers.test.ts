import { BadRequestError } from "../../../src/constants/error.constants.js";
import {
  buildPaginatedTableResponse,
  ensureAllowedTableName,
  resolveTableHandler,
} from "../../../src/mappers/table/table.service.mappers.js";

describe("table.service.mappers", () => {
  it("accepts allowed table names and rejects unsupported ones", () => {
    expect(() =>
      ensureAllowedTableName("patients" as never, new Set(["patients"] as never)),
    ).not.toThrow();

    expect(() =>
      ensureAllowedTableName("unknown" as never, new Set(["patients"] as never)),
    ).toThrow(BadRequestError);
  });

  it("resolves the matching table handler and throws when one is missing", () => {
    const handler = {
      find: async () => [],
      count: async () => 0,
    };
    const handlers = {
      patients: handler,
    } as never;

    expect(resolveTableHandler("patients" as never, handlers)).toBe(handler);
    expect(() => resolveTableHandler("missing" as never, handlers)).toThrow(
      'Table "missing" handler not found',
    );
  });

  it("builds paginated responses with copied item arrays and calculated page counts", () => {
    const items = [{ id: "1" }, { id: "2" }];
    const response = buildPaginatedTableResponse(items, 5, 2, 2);

    expect(response).toEqual({
      items: [{ id: "1" }, { id: "2" }],
      total: 5,
      page: 2,
      limit: 2,
      totalPages: 3,
    });

    items.push({ id: "3" });
    expect(response.items).toEqual([{ id: "1" }, { id: "2" }]);
  });
});
