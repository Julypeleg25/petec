import AuthController from "@controllers/authController";
import express from "express";
import { ENV } from "@config/config";
import connectToDatabase from "@db/dbConnection";
import { logger } from "@utils/logger/logger";
import router from "@routes/authRouter";
import authRouter from "@routes/authRouter";

const app = express();
const PORT = ENV.port;

await connectToDatabase().catch((error) => {
  logger.error("Failed to connect to the database:", error);
  process.exit(1);
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/", authRouter);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
