import "dotenv/config";
import Mailjet from "node-mailjet";
import logger from "./Logger";

const mailJetClient = new Mailjet({
  apiKey: process.env.MJ_APIKEY_PUBLIC,
  apiSecret: process.env.MJ_APIKEY_PRIVATE,
});

// textPart or/and htmlPart is required (also not empty)
export interface EmailData {
  to: string;
  subject: string;
  textPart?: string;
  htmlPart?: string;
  cc?: { Email: string; Name?: string }[];
  bcc?: { Email: string; Name?: string }[];
}

export async function sendEmail(emailData: EmailData) {
  const requestData = {
    Messages: [
      {
        from: { Email: "petecdrive@gmail.com" },
        To: [{ Email: emailData.to }],
        Subject: emailData.subject,
        TextPart: emailData.textPart,
        HTMLPart: emailData.htmlPart,
        Cc: emailData.cc,
        Bcc: emailData.bcc,
      },
    ],
  };

  try {
    const result = await mailJetClient
      .post("send", { version: "v3.1" })
      .request(requestData);
    logger.info("Email sent successfully");

    return result;
  } catch (error) {
    logger.error(`Error sending email: ${error}`);
  }
}
