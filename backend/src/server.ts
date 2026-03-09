import mongoose from "mongoose";
import app from "./app";
import { ENV } from "@config/config";
import { logger } from "@utils/logger";
import { APP_EXIT_CODE_ERROR } from "@petec/shared";
import connectToDatabase from "@db/dbConnection";
import { scheduleClinicSyncJob } from "./jobs/clinicSync.job";

const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 10000;

const startServer = async (): Promise<void> => {
  try {
    await connectToDatabase();

    scheduleClinicSyncJob();

    const server = app.listen(ENV.port, () => {
      logger.info(`Server running on port ${String(ENV.port)} in ${ENV.nodeEnv} mode`);
    });

    const gracefulShutdown = (signal: string): void => {
      logger.info(`${signal} received — shutting down gracefully`);

      server.close(async () => {
        try {
          await mongoose.connection.close();
          logger.info("MongoDB connection closed");
          process.exit(0);
        } catch (error) {
          logger.error("Error while closing MongoDB connection", {
            error: error instanceof Error ? error.message : String(error),
          });
          process.exit(APP_EXIT_CODE_ERROR);
        }
      });

      setTimeout(() => {
        logger.error("Graceful shutdown timed out, forcing exit");
        process.exit(APP_EXIT_CODE_ERROR);
      }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (err) {
    logger.error("Failed to start server", {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(APP_EXIT_CODE_ERROR);
  }
};

startServer();