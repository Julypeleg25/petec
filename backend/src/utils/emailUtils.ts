import { logger } from "@utils/logger";
import type { SendEmailOptions } from "@utils/emailUtils.types";

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  logger.info("Email send requested", {
    to: options.to,
    subject: options.subject,
  });
};
