import express from "express";
import cookieParser from "cookie-parser";
import {
  ROUTES,
  JSON_BODY_LIMIT,
  URL_ENCODED_BODY_LIMIT,
  HttpStatus,
} from "@petec/shared";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { requestLoggerMiddleware } from "./middlewares/requestLogger.middleware.js";
import { applyAppSecurity } from "./middlewares/security.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import authRoutes from "./routes/auth/index.js";
import patientRoutes from "./routes/patient/index.js";
import adminRoutes from "./routes/admin/index.js";
import tableRoutes from "./routes/table/index.js";
import userRoutes from "./routes/user/index.js";
import medicineRoutes from "./routes/medicine/index.js";
import clinicaRoutes from "./routes/clinica.routes.js";



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
app.use("/clinica", clinicaRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
