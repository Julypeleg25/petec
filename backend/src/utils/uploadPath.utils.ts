import path from "node:path";
import { ENV } from "@config/config";

export const DEFAULT_UPLOAD_DIR = "uploads";

export const UPLOAD_ROOT_DIR = path.resolve(
  process.cwd(),
  ENV.uploadDir ?? DEFAULT_UPLOAD_DIR,
);

export const toPosixPath = (p: string): string => p.replace(/\\/g, "/");
