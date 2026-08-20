import { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import { ENV } from "../config/config.js";
import { ForbiddenError } from "../constants/error.constants.js";

const CORS_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
] as const;
const CORS_ALLOWED_HEADERS = ["Content-Type", "Authorization"] as const;
const TRUSTED_FRONTEND_ORIGIN = new URL(ENV.frontendUrl).origin;

const validateRequestOrigin = (
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
): void => {
  if (!origin || origin === TRUSTED_FRONTEND_ORIGIN) {
    callback(null, true);
    return;
  }

  callback(new ForbiddenError("Origin is not allowed"));
};

export const applyAppSecurity = (app: Application) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: validateRequestOrigin,
      credentials: true,
      methods: [...CORS_METHODS],
      allowedHeaders: [...CORS_ALLOWED_HEADERS],
    }),
  );
};
