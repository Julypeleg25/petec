import { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import { ENV } from "../config/config.js";

const CORS_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
] as const;
const CORS_ALLOWED_HEADERS = ["Content-Type", "Authorization"] as const;

export const applyAppSecurity = (app: Application) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: ENV.frontendUrl,
      credentials: true,
      methods: [...CORS_METHODS],
      allowedHeaders: [...CORS_ALLOWED_HEADERS],
    }),
  );
};
