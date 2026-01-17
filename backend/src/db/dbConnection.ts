import { ENV } from "@config/config";
import mongoose from "mongoose";

const connectToDatabase = async () => {
  const mongoDBUrl = ENV.mongoDBUri;

  if (!mongoDBUrl) {
    throw new Error("MongoDB connection string is not defined");
  }

  try {
    mongoose.connection.on("error", (error) =>
      console.error("MongoDB connection error:", error)
    );
    mongoose.connection.once("open", () =>
      console.log(`Connected to MongoDB successfully via: ${mongoDBUrl}`)
    );

    await mongoose.connect(mongoDBUrl);

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

export default connectToDatabase;