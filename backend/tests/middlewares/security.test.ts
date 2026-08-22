import { jest } from "@jest/globals";

const helmetMock = jest.fn();
const corsMock = jest.fn();

jest.unstable_mockModule("helmet", () => ({
  default: helmetMock,
}));

jest.unstable_mockModule("cors", () => ({
  default: corsMock,
}));

jest.unstable_mockModule("../../src/config/config.js", () => ({
  ENV: {
    frontendUrl: "http://frontend.local",
  },
}));

const { applyAppSecurity } = await import("../../src/middlewares/security.js");

describe("security middleware", () => {
  afterEach(() => {
    helmetMock.mockReset();
    corsMock.mockReset();
  });

  it("applies helmet and cors with the expected config", () => {
    helmetMock.mockReturnValue("helmet-middleware");
    corsMock.mockReturnValue("cors-middleware");
    const app: any = {
      use: jest.fn(),
    };

    applyAppSecurity(app);

    expect(helmetMock).toHaveBeenCalledWith({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    });
    expect(corsMock).toHaveBeenCalledWith({
      origin: expect.any(Function),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });
    expect(app.use).toHaveBeenNthCalledWith(1, "helmet-middleware");
    expect(app.use).toHaveBeenNthCalledWith(2, "cors-middleware");

    const options = corsMock.mock.calls[0]?.[0] as {
      origin: (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
      ) => void;
    };
    const callback = jest.fn();
    options.origin("https://malicious.example", callback);
    expect(callback.mock.calls[0]?.[0]).toMatchObject({
      name: "ForbiddenError",
      statusCode: 403,
    });

    callback.mockClear();
    options.origin("http://frontend.local", callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });
});
