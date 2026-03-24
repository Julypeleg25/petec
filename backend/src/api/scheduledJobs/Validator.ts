import { getQueryRunner } from "../../config/typeORM";
import logger from "../../api/utils/Logger";
import { sendEmail } from "../utils/EmailService";

export const validateData = async () => {
  logger.info("Starting to validate data...");

  let queryRunner;

  try {
    queryRunner = getQueryRunner();
    await queryRunner.connect();

    const result = await queryRunner.query(`
        SELECT case_id, date
        FROM (
              SELECT case_id, date, ROW_NUMBER() OVER (ORDER BY id) AS row_num
              FROM petec.case_daily_details
             ) sub_query
        WHERE (row_num - 1) % 13 = 0
        GROUP BY case_id, date
        HAVING COUNT(case_id) > 1;
        `);

    if (result.length > 0) {
      sendEmail({
        to: "",
        subject: "Data Validation Error",
        textPart: `There are ${
          result.length
        } duplicate case daily details: ${JSON.stringify(result)}`,
      });
    }

    logger.info(`Finished to validate data`);
  } catch (err: any) {
    logger.error(`Failed to validate data: ${err.message}`);
  } finally {
    if (queryRunner) await queryRunner.release();
  }
};
