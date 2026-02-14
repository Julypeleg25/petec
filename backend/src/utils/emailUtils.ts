import { logger } from "@utils/logger";

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  logger.info("Email send requested", {
    to: options.to,
    subject: options.subject,
  });
};
