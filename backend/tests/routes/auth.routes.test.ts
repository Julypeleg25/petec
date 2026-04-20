import { jest } from "@jest/globals";
import { AUTH_ROUTE_PATHS } from "../../src/routes/auth/authRoutes.constants.js";

const authenticate = jest.fn();
const requireAdmin = jest.fn();
const validateBodyMock = jest.fn<(schema: unknown) => unknown>();
const authController = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
};

const createRouterMock = () => ({
  use: jest.fn<(...args: any[]) => void>(),
  get: jest.fn<(...args: any[]) => void>(),
  post: jest.fn<(...args: any[]) => void>(),
  put: jest.fn<(...args: any[]) => void>(),
  delete: jest.fn<(...args: any[]) => void>(),
});

const loadAuthRoutes = async () => {
  jest.resetModules();
  validateBodyMock.mockReset();
  validateBodyMock
    .mockReturnValueOnce({ kind: "validate-register" })
    .mockReturnValueOnce({ kind: "validate-login" })
    .mockReturnValueOnce({ kind: "validate-forgot" })
    .mockReturnValueOnce({ kind: "validate-reset" });

  const router = createRouterMock();

  jest.unstable_mockModule("express", () => ({
    Router: () => router,
  }));

  jest.unstable_mockModule("../../src/controllers/auth/index.js", () => ({
    authController,
  }));

  jest.unstable_mockModule("../../src/middlewares/auth.middleware.js", () => ({
    authenticate,
    requireAdmin,
  }));

  jest.unstable_mockModule("../../src/middlewares/validate.js", () => ({
    validateBody: validateBodyMock,
  }));

  const module = await import("../../src/routes/auth/auth.routes.js");
  return { router, module };
};

describe("auth.routes", () => {
  it("registers auth endpoints with the expected middleware chain", async () => {
    const { router, module } = await loadAuthRoutes();

    expect(module.default).toBe(router);
    expect(validateBodyMock).toHaveBeenCalledTimes(4);

    expect(router.post).toHaveBeenNthCalledWith(
      1,
      AUTH_ROUTE_PATHS.register,
      authenticate,
      requireAdmin,
      validateBodyMock.mock.results[0]?.value,
      authController.register,
    );
    expect(router.post).toHaveBeenNthCalledWith(
      2,
      AUTH_ROUTE_PATHS.login,
      validateBodyMock.mock.results[1]?.value,
      authController.login,
    );
    expect(router.post).toHaveBeenNthCalledWith(
      3,
      AUTH_ROUTE_PATHS.refresh,
      authController.refresh,
    );
    expect(router.post).toHaveBeenNthCalledWith(
      4,
      AUTH_ROUTE_PATHS.logout,
      authController.logout,
    );
    expect(router.post).toHaveBeenNthCalledWith(
      5,
      AUTH_ROUTE_PATHS.forgotPassword,
      validateBodyMock.mock.results[2]?.value,
      authController.forgotPassword,
    );
    expect(router.post).toHaveBeenNthCalledWith(
      6,
      AUTH_ROUTE_PATHS.resetPassword,
      validateBodyMock.mock.results[3]?.value,
      authController.resetPassword,
    );
  });
});
