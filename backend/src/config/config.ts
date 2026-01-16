import dotenv from "dotenv";
import config from "./config.json";

dotenv.config();

interface AppConfig {
  port: number;
  mongoDBUrl: string;
}

export const ENV: AppConfig = {
  port: Number(process.env.PORT) || config.port,
  mongoDBUrl: process.env.MONGODB_URL || config.mongoDBUrl,
};
