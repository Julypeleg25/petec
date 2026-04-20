import { jest } from "@jest/globals";

const ClientMock = jest.fn() as any;
const postMock = jest.fn() as any;
const requestMock = jest.fn() as any;
const infoMock = jest.fn();
const errorMock = jest.fn();

const loadEmailUtils = async (envOverrides: Partial<Record<string, string>> = {}) => {
  jest.resetModules();
  ClientMock.mockReset();
  postMock.mockReset();
  requestMock.mockReset();
  infoMock.mockReset();
  errorMock.mockReset();

  postMock.mockReturnValue({
    request: requestMock,
  });
  ClientMock.mockImplementation(() => ({
    post: postMock,
  }));

  jest.unstable_mockModule("node-mailjet", () => ({
    default: {
      Client: ClientMock,
    },
  }));

  jest.unstable_mockModule("../../src/config/config.js", () => ({
    ENV: {
      mailjetPublicKey: "public-key",
      mailjetPrivateKey: "private-key",
      mailAdmin: "admin@petec.test",
      ...envOverrides,
    },
  }));

  jest.unstable_mockModule("../../src/config/logger.js", () => ({
    logger: {
      info: infoMock,
      error: errorMock,
    },
  }));

  return import("../../src/utils/emailUtils.js");
};

describe("emailUtils", () => {
  it("rejects when mailjet keys are missing", async () => {
    const { sendEmail } = await loadEmailUtils({
      mailjetPublicKey: "",
      mailjetPrivateKey: "",
    });

    await expect(
      sendEmail({
        to: "owner@test.com",
        subject: "Hello",
        html: "<p>Hello</p>",
      }),
    ).rejects.toThrow("Email service is not configured");
  });

  it("rejects when no sender email is available", async () => {
    const { sendEmail } = await loadEmailUtils({
      mailAdmin: "",
    });

    await expect(
      sendEmail({
        to: "owner@test.com",
        subject: "Hello",
        html: "<p>Hello</p>",
      }),
    ).rejects.toThrow("Email service is not configured");
  });

  it("sends email through mailjet", async () => {
    const { sendEmail } = await loadEmailUtils();
    requestMock.mockResolvedValue({ ok: true });

    await expect(
      sendEmail({
        to: "owner@test.com",
        subject: "Appointment",
        html: "<p>Hi</p>",
      }),
    ).resolves.toBeUndefined();

    expect(infoMock).toHaveBeenCalledWith("Email send requested", {
      to: "owner@test.com",
      subject: "Appointment",
    });
    expect(ClientMock).toHaveBeenCalledWith({
      apiKey: "public-key",
      apiSecret: "private-key",
    });
    expect(postMock).toHaveBeenCalledWith("send", { version: "v3.1" });
    expect(requestMock).toHaveBeenCalledWith({
      Messages: [
        {
          From: {
            Email: "admin@petec.test",
            Name: "PETEC",
          },
          To: [{ Email: "owner@test.com" }],
          Subject: "Appointment",
          HTMLPart: "<p>Hi</p>",
        },
      ],
    });
  });

  it("uses a custom sender and wraps mailjet failures", async () => {
    const { sendEmail } = await loadEmailUtils();
    requestMock.mockRejectedValue(new Error("mailjet down"));

    await expect(
      sendEmail({
        to: "owner@test.com",
        from: "custom@test.com",
        subject: "Appointment",
        html: "<p>Hi</p>",
      }),
    ).rejects.toThrow("Failed to send email");

    expect(errorMock).toHaveBeenCalledWith("Email send failed", {
      to: "owner@test.com",
      subject: "Appointment",
      error: "mailjet down",
    });
  });
});