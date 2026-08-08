import {
  HttpStatus,
  JSON_BODY_LIMIT,
  ROUTES,
  URL_ENCODED_BODY_LIMIT,
} from "@petec/shared";
import { jest } from "@jest/globals";

const expressApp = {
  use: jest.fn<(...args: any[]) => void>(),
  get: jest.fn<(...args: any[]) => void>(),
};

const expressMock = Object.assign(
  jest.fn<() => typeof expressApp>().mockReturnValue(expressApp),
  {
    json: jest.fn<(...args: any[]) => any>(),
    urlencoded: jest.fn<(...args: any[]) => any>(),
  },
);

const cookieParserMock = jest.fn<() => any>();
const applyAppSecurityMock = jest.fn<(app: unknown) => void>();

const requestIdMiddleware = jest.fn();
const requestLoggerMiddleware = jest.fn();
const jsonMiddleware = jest.fn();
const urlencodedMiddleware = jest.fn();
const cookieParserMiddleware = jest.fn();
const notFound = jest.fn();
const errorHandler = jest.fn();

const authRoutes = { name: "auth-routes" };
const patientRoutes = { name: "patient-routes" };
const adminRoutes = { name: "admin-routes" };
const tableRoutes = { name: "table-routes" };
const userRoutes = { name: "user-routes" };
const medicineRoutes = { name: "medicine-routes" };
const clinicaRoutes = { name: "clinica-routes" };

expressMock.json.mockReturnValue(jsonMiddleware);
expressMock.urlencoded.mockReturnValue(urlencodedMiddleware);
cookieParserMock.mockReturnValue(cookieParserMiddleware);

jest.unstable_mockModule("express", () => ({
  default: expressMock,
}));

jest.unstable_mockModule("cookie-parser", () => ({
  default: cookieParserMock,
}));

jest.unstable_mockModule("../src/middlewares/requestId.js", () => ({
  requestIdMiddleware,
}));

jest.unstable_mockModule("../src/middlewares/requestLogger.middleware.js", () => ({
  requestLoggerMiddleware,
}));

jest.unstable_mockModule("../src/middlewares/security.js", () => ({
  applyAppSecurity: applyAppSecurityMock,
}));

jest.unstable_mockModule("../src/middlewares/notFound.middleware.js", () => ({
  notFound,
}));

jest.unstable_mockModule("../src/middlewares/error.middleware.js", () => ({
  errorHandler,
}));

jest.unstable_mockModule("../src/routes/auth/index.js", () => ({
  default: authRoutes,
}));

jest.unstable_mockModule("../src/routes/patient/index.js", () => ({
  default: patientRoutes,
}));

jest.unstable_mockModule("../src/routes/admin/index.js", () => ({
  default: adminRoutes,
}));

jest.unstable_mockModule("../src/routes/table/index.js", () => ({
  default: tableRoutes,
}));

jest.unstable_mockModule("../src/routes/user/index.js", () => ({
  default: userRoutes,
}));

jest.unstable_mockModule("../src/routes/medicine/index.js", () => ({
  default: medicineRoutes,
}));

jest.unstable_mockModule("../src/routes/clinica/index.js", () => ({
  default: clinicaRoutes,
}));

const loadAppModule = async () => {
  jest.resetModules();
  expressMock.mockClear();
  expressMock.json.mockClear();
  expressMock.urlencoded.mockClear();
  cookieParserMock.mockClear();
  applyAppSecurityMock.mockClear();
  expressApp.use.mockClear();
  expressApp.get.mockClear();

  expressMock.json.mockReturnValue(jsonMiddleware);
  expressMock.urlencoded.mockReturnValue(urlencodedMiddleware);
  cookieParserMock.mockReturnValue(cookieParserMiddleware);

  return import("../src/app.js");
};

describe("app.ts", () => {
  it("configures the express app with middleware, routes, and error handlers", async () => {
    const appModule = await loadAppModule();

    expect(appModule.default).toBe(expressApp);
    expect(applyAppSecurityMock).toHaveBeenCalledWith(expressApp);
    expect(cookieParserMock).toHaveBeenCalled();
    expect(expressMock.json).toHaveBeenCalledWith({ limit: JSON_BODY_LIMIT });
    expect(expressMock.urlencoded).toHaveBeenCalledWith({
      extended: true,
      limit: URL_ENCODED_BODY_LIMIT,
    });

    expect(expressApp.use).toHaveBeenCalledWith(requestIdMiddleware);
    expect(expressApp.use).toHaveBeenCalledWith(requestLoggerMiddleware);
    expect(expressApp.use).toHaveBeenCalledWith(cookieParserMiddleware);
    expect(expressApp.use).toHaveBeenCalledWith(jsonMiddleware);
    expect(expressApp.use).toHaveBeenCalledWith(urlencodedMiddleware);
    expect(expressApp.use).toHaveBeenCalledWith(ROUTES.AUTH, authRoutes);
    expect(expressApp.use).toHaveBeenCalledWith(ROUTES.PATIENT, patientRoutes);
    expect(expressApp.use).toHaveBeenCalledWith(ROUTES.ADMIN, adminRoutes);
    expect(expressApp.use).toHaveBeenCalledWith(ROUTES.TABLE, tableRoutes);
    expect(expressApp.use).toHaveBeenCalledWith(ROUTES.USERS, userRoutes);
    expect(expressApp.use).toHaveBeenCalledWith(ROUTES.MEDICINE, medicineRoutes);
    expect(expressApp.use).toHaveBeenCalledWith(notFound);
    expect(expressApp.use).toHaveBeenCalledWith(errorHandler);
  });

  it("registers a healthy status endpoint", async () => {
    await loadAppModule();

    const healthCall = expressApp.get.mock.calls.find(
      ([path]) => path === ROUTES.HEALTH,
    );

    expect(healthCall).toBeDefined();

    const handler = healthCall?.[1] as (req: unknown, res: any) => void;
    const res = {
      status: jest.fn(function mockStatus(this: any) {
        return this;
      }),
      json: jest.fn<(...args: any[]) => void>(),
    };

    handler({}, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { status: "healthy" },
    });
  });
});
