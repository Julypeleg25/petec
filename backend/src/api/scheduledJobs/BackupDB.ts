import { exec } from "child_process";
import path from "path";
import * as fs from "fs";
import { google } from "googleapis";
import { zipFile } from "../utils/FileUtils";
import logger from "../../api/utils/Logger";

export const backupDatabase = async () => {
  logger.info("Starting database backup...");

  // Create the file
  const backupFile = `backup_${new Date().toISOString().split("T")[0]}.pgsql`;
  const backupFilePath = path.join(__dirname, backupFile);
  const zipFilePath = path.join(
    __dirname,
    `backup_${new Date().toISOString().split("T")[0]}.zip`
  );

  const command = `pg_dump ${
    process.env.NODE_ENV === "production" ? "-h pet-ec-db.internal -p 5433" : ""
  } -U ${process.env.DB_USERNAME} -d ${
    process.env.DB_NAME
  } -f ${backupFilePath}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      logger.error(`error: ${error.message}`);
      return;
    }

    logger.info(`Database backup successful: ${backupFilePath}`);

    zipFile(backupFilePath, zipFilePath)
      .then(() => {
        logger.info(`File successfully zipped: ${zipFilePath}`);

        // Upload to Google drive
        const jwtClient = new google.auth.JWT(
          process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
          undefined,
          process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/gm, "\n"),
          ["https://www.googleapis.com/auth/drive.file"]
        );

        jwtClient.authorize(async (err, tokens) => {
          if (err) {
            logger.error(`Error authorizing JWT: ${err}`);
            return;
          }

          const drive = google.drive({ version: "v3", auth: jwtClient });

          const fileMetadata = {
            name: path.basename(zipFilePath),
            parents: ["1nO4sI13hplOJgCfCK86236CLVnOxRuJH"], // The folder ID in Google Drive
          };
          const media = {
            mimeType: "application/zip",
            body: fs.createReadStream(zipFilePath),
          };

          try {
            await drive.files.create({
              requestBody: fileMetadata,
              media: media,
              fields: "id",
            });

            logger.info("Backup uploaded to Google Drive");
            fs.unlinkSync(backupFilePath); // Delete the local backup file after uploading
            fs.unlinkSync(zipFilePath); // Delete the local zip file after uploading
          } catch (uploadError) {
            logger.error(`Error uploading to Google Drive: ${uploadError}`);
          }
        });
      })
      .catch((zipError) => {
        logger.error(`Error zipping file: ${zipError}`);
      });
  });
};
