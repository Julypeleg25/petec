import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { ENV } from "@config/config";
import { ROUTES, RATE_LIMIT, JSON_BODY_LIMIT, HttpStatus } from "@petec/shared";
import { requestId } from "@middlewares/requestId";
import { requestLogger } from "@middlewares/requestLogger";
import { errorHandler } from "@middlewares/errorsHandler";
import { notFound } from "@middlewares/notFound.middleware";

import authRoutes from "@routes/auth.routes";
import patientRoutes from "@routes/patient.routes";
import adminRoutes from "@routes/admin.routes";
import tableRoutes from "@routes/table.routes";
import userRoutes from "@routes/user.routes";

const app = express();

app.use(requestId);
app.use(requestLogger);

app.use(helmet());

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: ENV.frontendUrl,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(cookieParser());
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true }));

app.get(ROUTES.HEALTH, (_req, res) => {
  res.status(HttpStatus.OK).json({ success: true, data: { status: "healthy" } });
});

app.use(ROUTES.AUTH, authLimiter, authRoutes);
app.use(ROUTES.PATIENT, patientRoutes);
app.use(ROUTES.ADMIN, adminRoutes);
app.use(ROUTES.TABLE, tableRoutes);
app.use(ROUTES.USERS, userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
