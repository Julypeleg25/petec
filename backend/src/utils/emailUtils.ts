import { MAIL_ADMIN } from "@config/constants";
import "dotenv/config";
import Mailjet from "node-mailjet";
import { logger } from "./logger/logger";
import { ENV } from "@config/config";

const mailJetClient = new Mailjet({
  apiKey: ENV.mailjetPublicKey,
  apiSecret: ENV.mailjetPrivateKey,
});

export interface EmailData {
  to: string;
  subject: string;
  textPart?: string;
  htmlPart?: string;
  cc?: { Email: string; Name?: string }[];
  bcc?: { Email: string; Name?: string }[];
}

export const sendEmail = async (emailData: EmailData) => {
  if (!emailData.to) throw new Error("Email recipient is required");
  if (!emailData.textPart && !emailData.htmlPart)
    throw new Error("Either textPart or htmlPart must be provided");

  const requestData = {
    Messages: [
      {
        From: { Email: MAIL_ADMIN },
        To: [{ Email: emailData.to }],
        Subject: emailData.subject,
        TextPart: emailData.textPart,
        HTMLPart: emailData.htmlPart,
        Cc: emailData.cc || [],
        Bcc: emailData.bcc || [],
      },
    ],
  };

  try {
    const result = await mailJetClient
      .post("send", { version: "v3.1" })
      .request(requestData);
    logger.info("Email sent successfully");
    return { success: true, message: "Email sent" };
  } catch (err: any) {
    logger.error(
      `Error sending email: ${err?.response?.body?.Messages || err.message}`
    );
    throw new Error("Failed to send email");
  }
};

export const getEmailData = (resetUrl: string, email: string) => {
  const emailData: EmailData = {
    to: email,
    subject: "Reset Password",
    htmlPart: `Click <a href="${resetUrl}">here</a> to reset your password.`,
  };
  return emailData;
};
