import { jest } from "@jest/globals";
import { MEDICINE_ROUTE_PATHS } from "../../src/routes/medicine/medicineRoutes.constants.js";
import { TABLE_ROUTE_PATHS } from "../../src/routes/table/tableRoutes.constants.js";
import { USER_ROUTE_PATHS } from "../../src/routes/user/userRoutes.constants.js";

const authenticate = jest.fn();
const validateBodyMock = jest.fn<(schema: unknown) => unknown>();
const validateParamsMock = jest.fn<(schema: unknown) => unknown>();
const requireTableReadPermission = jest.fn();

const userController = {
  getDoctors: jest.fn(),
  getNurses: jest.fn(),
};

const medicineController = {
  getAll: jest.fn(),
  getAllByCategoryType: jest.fn(),
  getAllCategoryTypes: jest.fn(),
  getMedicinesFrequencies: jest.fn(),
  getMedicinesRoutesForAdministration: jest.fn(),
  getMeasureUnitTypes: jest.fn(),
};

const tableController = {
  getTableData: jest.fn(),
};

const createRouterMock = () => ({
  use: jest.fn<(...args: any[]) => void>(),
  get: jest.fn<(...args: any[]) => void>(),
  post: jest.fn<(...args: any[]) => void>(),
  put: jest.fn<(...args: any[]) => void>(),
  delete: jest.fn<(...args: any[]) => void>(),
});

const loadUserRoutes = async () => {
  jest.resetModules();
  const router = createRouterMock();

  jest.unstable_mockModule("express", () => ({
    Router: () => router,
  }));
  jest.unstable_mockModule("../../src/controllers/user/index.js", () => ({
    userController,
  }));
  jest.unstable_mockModule("../../src/middlewares/auth.middleware.js", () => ({
    authenticate,
  }));

  const module = await import("../../src/routes/user/user.routes.js");
  return { router, module };
};

const loadMedicineRoutes = async () => {
  jest.resetModules();
  validateParamsMock.mockReset();
  validateParamsMock.mockReturnValue({ kind: "validate-category" });
  const router = createRouterMock();

  jest.unstable_mockModule("express", () => ({
    Router: () => router,
  }));
  jest.unstable_mockModule("../../src/controllers/medicine/index.js", () => ({
    medicineController,
  }));
  jest.unstable_mockModule("../../src/middlewares/auth.middleware.js", () => ({
    authenticate,
  }));
  jest.unstable_mockModule("../../src/middlewares/validate.js", () => ({
    validateParams: validateParamsMock,
  }));

  const module = await import("../../src/routes/medicine/medicine.routes.js");
  return { router, module };
};

const loadTableRoutes = async () => {
  jest.resetModules();
  validateBodyMock.mockReset();
  validateBodyMock.mockReturnValue({ kind: "validate-table-body" });
  const router = createRouterMock();

  jest.unstable_mockModule("express", () => ({
    Router: () => router,
  }));
  jest.unstable_mockModule("../../src/controllers/table/index.js", () => ({
    tableController,
  }));
  jest.unstable_mockModule("../../src/middlewares/auth.middleware.js", () => ({
    authenticate,
  }));
  jest.unstable_mockModule("../../src/middlewares/validate.js", () => ({
    validateBody: validateBodyMock,
  }));
  jest.unstable_mockModule(
    "../../src/routes/table/tableAuthorization.middleware.js",
    () => ({ requireTableReadPermission }),
  );

  const module = await import("../../src/routes/table/table.routes.js");
  return { router, module };
};

describe("resource routes", () => {
  it("registers user routes behind authentication", async () => {
    const { router, module } = await loadUserRoutes();

    expect(module.default).toBe(router);
    expect(router.use).toHaveBeenCalledWith(authenticate);
    expect(router.get).toHaveBeenNthCalledWith(
      1,
      USER_ROUTE_PATHS.doctors,
      userController.getDoctors,
    );
    expect(router.get).toHaveBeenNthCalledWith(
      2,
      USER_ROUTE_PATHS.nurses,
      userController.getNurses,
    );
  });

  it("registers medicine routes with param validation where needed", async () => {
    const { router, module } = await loadMedicineRoutes();

    expect(module.default).toBe(router);
    expect(router.use).toHaveBeenCalledWith(authenticate);
    expect(validateParamsMock).toHaveBeenCalledTimes(1);
    expect(router.get).toHaveBeenNthCalledWith(
      1,
      MEDICINE_ROUTE_PATHS.all,
      medicineController.getAll,
    );
    expect(router.get).toHaveBeenNthCalledWith(
      2,
      MEDICINE_ROUTE_PATHS.byCategory,
      validateParamsMock.mock.results[0]?.value,
      medicineController.getAllByCategoryType,
    );
    expect(router.get).toHaveBeenNthCalledWith(
      3,
      MEDICINE_ROUTE_PATHS.categoryTypes,
      medicineController.getAllCategoryTypes,
    );
    expect(router.get).toHaveBeenNthCalledWith(
      4,
      MEDICINE_ROUTE_PATHS.frequencies,
      medicineController.getMedicinesFrequencies,
    );
    expect(router.get).toHaveBeenNthCalledWith(
      5,
      MEDICINE_ROUTE_PATHS.routesOfAdministration,
      medicineController.getMedicinesRoutesForAdministration,
    );
    expect(router.get).toHaveBeenNthCalledWith(
      6,
      MEDICINE_ROUTE_PATHS.measureUnits,
      medicineController.getMeasureUnitTypes,
    );
  });

  it("registers table routes with authentication and body validation", async () => {
    const { router, module } = await loadTableRoutes();

    expect(module.default).toBe(router);
    expect(router.use).toHaveBeenCalledWith(authenticate);
    expect(validateBodyMock).toHaveBeenCalledTimes(1);
    expect(router.post).toHaveBeenCalledWith(
      TABLE_ROUTE_PATHS.root,
      validateBodyMock.mock.results[0]?.value,
      requireTableReadPermission,
      tableController.getTableData,
    );
  });
});
