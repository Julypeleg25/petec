import { Express } from "express";
import TableService from "../services/TableService";
import { AppDataSource } from "../../config/typeORM";
import logger from "../utils/Logger";
import initApp from "../../config/app";
import { deleteAllDBTablesData } from "./TestUtils";

let app: Express;

beforeAll(async () => {
  logger.info("start table beforeAll");
  app = await initApp();

  logger.info("end table beforeAll");
});

afterAll(async () => {
  logger.info("start table afterAll");

  await deleteAllDBTablesData();
  await AppDataSource.destroy();

  logger.info("end table afterAll");
});

describe("Table tests", () => {
  describe("getFiltersString", () => {
    it("should return 1 = 1 when no filters are provided", () => {
      const result = TableService.getFiltersString(null);
      expect(result).toBe("1 = 1");
    });

    it("should return correct filter string", () => {
      const filters = { name: "test", date: "2023-07-01" };
      const result = TableService.getFiltersString(filters);
      expect(result).toContain("name::text LIKE 'test%'");
      expect(result).toContain(
        "date BETWEEN '2023-07-01 00:00:00:000' AND '2023-07-01 23:59:59:000'"
      );
    });

    it("should return 1 = 1 when no filters are provided", () => {
      const result = TableService.getFiltersString(null);
      expect(result).toBe("1 = 1");
    });

    it("should return correct filter string with one filter", () => {
      const filters = { name: "test" };
      const result = TableService.getFiltersString(filters);
      expect(result).toContain("name::text LIKE 'test%'");
    });

    it("should return correct filter string with multiple filters", () => {
      const filters = { name: "test", date: "2023-07-01", status: "active" };
      const result = TableService.getFiltersString(filters);
      expect(result).toContain("name::text LIKE 'test%'");
      expect(result).toContain(
        "date BETWEEN '2023-07-01 00:00:00:000' AND '2023-07-01 23:59:59:000'"
      );
      expect(result).toContain("status::text LIKE 'active%'");
    });

    it("should handle filters with special characters", () => {
      const filters = { name: "test'string", status: "inactive" };
      const result = TableService.getFiltersString(filters);
      expect(result).toContain("name::text LIKE 'test''string%'");
      expect(result).toContain("status::text LIKE 'inactive%'");
    });
  });

  describe("getOrderByString", () => {
    it("should return 1 when no orderByList is provided", () => {
      const result = TableService.getOrderByString(null);
      expect(result).toBe("1");
    });

    it("should return correct order by string", () => {
      const orderByList = { name: "ASC", date: "DESC" };
      const result = TableService.getOrderByString(orderByList);
      expect(result).toBe("name ASC, date DESC");
    });

    it("should return 1 when no orderByList is provided", () => {
      const result = TableService.getOrderByString(null);
      expect(result).toBe("1");
    });

    it("should return correct order by string with one field", () => {
      const orderByList = { name: "ASC" };
      const result = TableService.getOrderByString(orderByList);
      expect(result).toBe("name ASC");
    });

    it("should return correct order by string with multiple fields", () => {
      const orderByList = { name: "ASC", date: "DESC" };
      const result = TableService.getOrderByString(orderByList);
      expect(result).toBe("name ASC, date DESC");
    });
  });

  describe("getOrderByString", () => {
    it("should return 1 when no orderByList is provided", () => {
      const result = TableService.getOrderByString(null);
      expect(result).toBe("1");
    });

    it("should return correct order by string", () => {
      const orderByList = { name: "ASC", date: "DESC" };
      const result = TableService.getOrderByString(orderByList);
      expect(result).toBe("name ASC, date DESC");
    });

    it("should return 1 when no orderByList is provided", () => {
      const result = TableService.getOrderByString(null);
      expect(result).toBe("1");
    });

    it("should return correct order by string with one field", () => {
      const orderByList = { name: "ASC" };
      const result = TableService.getOrderByString(orderByList);
      expect(result).toBe("name ASC");
    });

    it("should return correct order by string with multiple fields", () => {
      const orderByList = { name: "ASC", date: "DESC" };
      const result = TableService.getOrderByString(orderByList);
      expect(result).toBe("name ASC, date DESC");
    });
  });

  describe("addVariables", () => {
    it("should return empty string when no variables are provided", () => {
      const result = TableService.addVariables(null);
      expect(result).toBe("");
    });

    it("should return correct variables string", () => {
      const variables = { userId: "INT" };
      const result = TableService.addVariables(variables);
      expect(result).toBe("DECLARE @userId INT = ? ");
    });
    it("should return empty string when no variables are provided", () => {
      const result = TableService.addVariables(null);
      expect(result).toBe("");
    });

    it("should return correct variables string with one variable", () => {
      const variables = { userId: "INT" };
      const result = TableService.addVariables(variables);
      expect(result).toBe("DECLARE @userId INT = ? ");
    });

    it("should return correct variables string with multiple variables", () => {
      const variables = { userId: "INT", userName: "VARCHAR(100)" };
      const result = TableService.addVariables(variables);
      expect(result).toBe(
        "DECLARE @userId INT = ? DECLARE @userName VARCHAR(100) = ? "
      );
    });

    it("should handle variables with complex types", () => {
      const variables = { userId: "INT", createdDate: "DATETIME" };
      const result = TableService.addVariables(variables);
      expect(result).toBe(
        "DECLARE @userId INT = ? DECLARE @createdDate DATETIME = ? "
      );
    });
  });
});
