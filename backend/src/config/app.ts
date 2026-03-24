import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import errorHandler from "../api/middlewares/error-handler";
import adminRoutes from "../api/routes/AdminRoutes";
import medicineRoutes from "../api/routes/MedicineRoutes";
import authRoutes from "../api/routes/AuthRoutes";
import tableRoutes from "../api/routes/TableRoute";
import patientRoutes from "../api/routes/PatientRouter";
import userRoutes from "../api/routes/UserRoutes";
import authMiddleware from "../api/middlewares/AuthMiddleware";
import path from "path";
import { Express } from "express";
import { AppDataSource } from "./typeORM";
import * as schedule from "node-schedule";
import { backupDatabase } from "../api/scheduledJobs/BackupDB";
import logger from "../api/utils/Logger";
import { moveCasesFromArchive } from "../api/scheduledJobs/MoveCasesFromArchive";

const initApp = (): Promise<Express> => {
  const promise = new Promise<Express>((resolve2) => {
    AppDataSource.initialize().then(() => {
      const app = express();

      // Static folder
      app.use("/", express.static(path.resolve("public")));
      app.use("/uploads", express.static(path.resolve("uploads")));

      app.use(
        cors({
          exposedHeaders: ["Content-Disposition", "X-Filename", "Content-Type"],
        })
      );
      app.use(bodyParser.json());

      // Routes
      app.use("/admin", authMiddleware, adminRoutes);
      app.use("/auth", authRoutes);
      app.use("/table", tableRoutes);
      app.use("/patient", patientRoutes);
      app.use("/user", authMiddleware, userRoutes);
      app.use("/medicine", authMiddleware, medicineRoutes);

      // Scheduled jobs
      if (process.env.NODE_ENV === "production") {
        logger.info("Initializing scheduled jobs...");
        schedule.scheduleJob({ hour: 23, minute: 0 }, backupDatabase);
        schedule.scheduleJob({ hour: 8, minute: 0 }, moveCasesFromArchive);
      }

      app.use(errorHandler);
      resolve2(app);
    });
  });

  return promise;
};


export default initApp;
