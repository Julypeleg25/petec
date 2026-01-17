import { ENV } from "@config/config";
import { logger } from "@utils/logger/logger";
import mongoose from "mongoose";

const connectToDatabase = async () => {
  const mongoDBUrl = ENV.mongoDBUri;

  if (!mongoDBUrl) {
    throw new Error("MongoDB connection string is not defined");
  }

  try {
    mongoose.connection.on("error", (error) =>
      logger.error("MongoDB connection error:", error)
    );
    mongoose.connection.once("open", () =>
      logger.info(`Connected to MongoDB successfully via: ${mongoDBUrl}`)
    );

    await mongoose.connect(mongoDBUrl);
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

export default connectToDatabase;
