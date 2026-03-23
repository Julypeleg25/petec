import Mailjet from "node-mailjet";
import { ENV } from "../config/config.js";
import { logger } from "../config/logger.js";
import { InternalServerError } from "../constants/error.constants.js";
import type { SendEmailOptions } from "../types/emailUtils.types.js";

const MAILJET_SEND_RESOURCE = "send";
const MAILJET_VERSION = "v3.1";
const DEFAULT_SENDER_NAME = "PETEC";

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  if (
    ENV.mailjetPublicKey.length === 0 ||
    ENV.mailjetPrivateKey.length === 0
  ) {
    throw new InternalServerError("Email service is not configured");
  }

  const fromEmail = options.from ?? ENV.mailAdmin;
  if (fromEmail.length === 0) {
    throw new InternalServerError("Email service is not configured");
  }

  logger.info("Email send requested", {
    to: options.to,
    subject: options.subject,
  });

  const mailjet = new Mailjet.Client({
    apiKey: ENV.mailjetPublicKey,
    apiSecret: ENV.mailjetPrivateKey,
  });

  try {
    await mailjet
      .post(MAILJET_SEND_RESOURCE, { version: MAILJET_VERSION })
      .request({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: DEFAULT_SENDER_NAME,
            },
            To: [
              {
                Email: options.to,
              },
            ],
            Subject: options.subject,
            HTMLPart: options.html,
          },
        ],
      });
  } catch (error) {
    logger.error("Email send failed", {
      to: options.to,
      subject: options.subject,
      error:
        error instanceof Error ? error.message : "Unknown email send error",
    });

    throw new InternalServerError(
      "Failed to send email",
      error instanceof Error ? error : undefined,
    );
  }
};
