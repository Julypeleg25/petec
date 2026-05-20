import { jest } from "@jest/globals";

const connectMock = jest.fn<(...args: any[]) => Promise<any>>();
const onMock = jest.fn<(...args: any[]) => void>();
const onceMock = jest.fn<(...args: any[]) => void>();
const infoMock = jest.fn<(...args: any[]) => void>();
const errorMock = jest.fn<(...args: any[]) => void>();

const loadDbConnectionModule = async (mongoDBUri: string) => {
  jest.unstable_mockModule("../../src/config/config.js", () => ({
    ENV: {
      mongoDBUri,
    },
  }));

  jest.unstable_mockModule("../../src/config/logger.js", () => ({
    logger: {
      info: infoMock,
      error: errorMock,
    },
  }));

  jest.unstable_mockModule("mongoose", () => ({
    default: {
      connect: connectMock,
      connection: {
        on: onMock,
        once: onceMock,
      },
    },
  }));

  return import("../../src/db/dbConnection.js");
};

describe("dbConnection", () => {
  beforeEach(() => {
    jest.resetModules();
    connectMock.mockReset();
    onMock.mockReset();
    onceMock.mockReset();
    infoMock.mockReset();
    errorMock.mockReset();
  });

  it("rejects when no MongoDB connection string is configured", async () => {
    const { default: connectToDatabase } = await loadDbConnectionModule("");

    await expect(connectToDatabase()).rejects.toThrow(
      "MongoDB connection string is not defined",
    );

    expect(connectMock).not.toHaveBeenCalled();
  });

  it("registers connection listeners and connects to MongoDB", async () => {
    connectMock.mockResolvedValue(undefined);
    const { default: connectToDatabase } = await loadDbConnectionModule(
      "mongodb://localhost/petec",
    );

    await expect(connectToDatabase()).resolves.toBeUndefined();

    expect(onMock).toHaveBeenCalledWith("error", expect.any(Function));
    expect(onceMock).toHaveBeenCalledWith("open", expect.any(Function));
    expect(connectMock).toHaveBeenCalledWith("mongodb://localhost/petec");

    const onError = onMock.mock.calls[0]?.[1] as (error: Error) => void;
    const onOpen = onceMock.mock.calls[0]?.[1] as () => void;
    onError(new Error("network issue"));
    onOpen();

    expect(errorMock).toHaveBeenCalledWith("MongoDB connection error", {
      module: "db",
      error_name: "Error",
      error_message: "network issue",
    });
    expect(infoMock).toHaveBeenCalledWith("Connected to MongoDB successfully", {
      module: "db",
    });
  });

  it("logs and rethrows connection failures", async () => {
    const error = new Error("authentication failed");
    connectMock.mockRejectedValue(error);
    const { default: connectToDatabase } = await loadDbConnectionModule(
      "mongodb://localhost/petec",
    );

    await expect(connectToDatabase()).rejects.toThrow("authentication failed");

    expect(errorMock).toHaveBeenCalledWith("Error connecting to MongoDB", {
      module: "db",
      error_name: "Error",
      error_message: "authentication failed",
    });
  });
});
