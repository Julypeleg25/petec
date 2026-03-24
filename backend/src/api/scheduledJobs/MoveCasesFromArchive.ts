import { getQueryRunner } from "../../config/typeORM";
import logger from "../../api/utils/Logger";

export const moveCasesFromArchive = async () => {
  logger.info("Starting to move cases from archive...");

  let queryRunner;

  try {
    queryRunner = getQueryRunner();
    await queryRunner.connect();

    const result = await queryRunner.query(`
        UPDATE petec.case
        SET is_archived = false
        WHERE procedure_date IS NOT NULL AND procedure_date::date = CURRENT_DATE AND is_archived = true;
        `);

    logger.info(
      `Finished moving ${result.length > 1 && result[1]} cases from archive`
    );
  } catch (err: any) {
    logger.error(`Failed to move cases from archive: ${err.message}`);
  } finally {
    if (queryRunner) await queryRunner.release();
  }
};
