import { jest } from "@jest/globals";

const helmetMock = jest.fn();
const corsMock = jest.fn();

jest.unstable_mockModule("helmet", () => ({
  default: helmetMock,
}));

jest.unstable_mockModule("cors", () => ({
  default: corsMock,
}));

jest.unstable_mockModule("../config/config.js", () => ({
  ENV: {
    frontendUrl: "http://frontend.local",
  },
}));

const { applyAppSecurity } = await import("./security.js");

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
      origin: "http://frontend.local",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    });
    expect(app.use).toHaveBeenNthCalledWith(1, "helmet-middleware");
    expect(app.use).toHaveBeenNthCalledWith(2, "cors-middleware");
  });
});
