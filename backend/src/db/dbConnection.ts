import { ENV } from "../config/config.js";
import { logger } from "../config/logger.js";
import mongoose from "mongoose";

const connectToDatabase = async () => {
  const mongoDBUrl = ENV.mongoDBUri;

  if (!mongoDBUrl) {
    throw new Error("MongoDB connection string is not defined");
  }

  try {
    mongoose.connection.on("error", (error) =>
      logger.error("MongoDB connection error", {
        module: "db",
        error_name: error.name,
        error_message: error.message,
      })
    );
    mongoose.connection.once("open", () =>
      logger.info("Connected to MongoDB successfully", {
        module: "db",
      })
    );

    await mongoose.connect(mongoDBUrl);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error connecting to MongoDB", {
      module: "db",
      error_name: err.name,
      error_message: err.message,
    });
    throw error;
  }
};

export default connectToDatabase;
