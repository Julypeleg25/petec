import express from "express";
import cookieParser from "cookie-parser";
import {
  ROUTES,
  JSON_BODY_LIMIT,
  URL_ENCODED_BODY_LIMIT,
  HttpStatus,
} from "@petec/shared";
import { requestIdMiddleware } from "@middlewares/requestId";
import { requestLoggerMiddleware } from "@middlewares/requestLogger.middleware";
import { applyAppSecurity } from "@middlewares/security";
import { errorHandler } from "@middlewares/error.middleware";
import { notFound } from "@middlewares/notFound.middleware";
import authRoutes from "@routes/auth.routes";
import patientRoutes from "@routes/patient.routes";
import adminRoutes from "@routes/admin.routes";
import tableRoutes from "@routes/table.routes";
import userRoutes from "@routes/user.routes";
import medicineRoutes from "@routes/medicine.routes";

const app = express();

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
applyAppSecurity(app);

app.use(cookieParser());
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: URL_ENCODED_BODY_LIMIT }));

app.get(ROUTES.HEALTH, (_req, res) => {
    res.status(HttpStatus.OK).json({ success: true, data: { status: "healthy" } });
});

app.use(ROUTES.AUTH, authRoutes);
app.use(ROUTES.PATIENT, patientRoutes);
app.use(ROUTES.ADMIN, adminRoutes);
app.use(ROUTES.TABLE, tableRoutes);
app.use(ROUTES.USERS, userRoutes);
app.use(ROUTES.MEDICINE, medicineRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

