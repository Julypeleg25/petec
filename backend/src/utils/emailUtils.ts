import { logger } from "@config/logger";
import type { SendEmailOptions } from "@app-types/emailUtils.types";

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  logger.info("Email send requested", {
    to: options.to,
    subject: options.subject,
  });
};
