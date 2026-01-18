import { ENV } from "@config/config";
import express from "express";
import mongoose from "mongoose";
// import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "@routes/authRouter";
import { errorHandler } from "@middlewares/errorsHandler";
import connectToDatabase from "@db/dbConnection";
import { logger } from "@utils/logger/logger";

const PORT = ENV.port;

const app = express();
app.use(cookieParser());

app.use(
  cors({
    origin: ENV.frontendUrl,
    credentials: true,
  }),
);

await connectToDatabase().catch((error) => {
  logger.error("Failed to connect to the database:", error);
  process.exit(1);
});
app.use(express.json());
// app.use(
//   session({
//     secret: ENV.SESSION_SECRET || "your-secret-key",
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: true },
//   })
// );
app.use("/", authRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
