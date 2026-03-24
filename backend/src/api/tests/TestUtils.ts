import { getQueryRunner } from "../../config/typeORM";

export const deleteAllDBTablesData = async () => {
  console.log("Starting to delete all data...");

  let queryRunner;

  try {
    queryRunner = getQueryRunner();
    await queryRunner.connect();

    await queryRunner.query(`
          SET session_replication_role = 'replica';

          SELECT tablename FROM pg_tables WHERE schemaname = 'petec';
              
          DO $$ DECLARE
              table_name TEXT;
          BEGIN
              FOR table_name IN (SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'petec') LOOP
                  EXECUTE 'TRUNCATE TABLE petec.' || quote_ident(table_name) || ' CASCADE;';
              END LOOP;
          END $$;
              
          SET session_replication_role = 'origin';
              
          COMMIT;
          `);

    console.log(`Finished deleting all data`);
  } catch (err: any) {
    console.error(`Failed to delete all data: ${err.message}`);
  } finally {
    if (queryRunner) await queryRunner.release();
  }
};
