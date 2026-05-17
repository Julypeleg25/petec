import path from "node:path";
import { UPLOAD } from "@petec/shared";
import { ENV } from "../config/config.js";

export const UPLOAD_ROOT_DIR = path.resolve(
  process.cwd(),
  ENV.uploadDir ?? UPLOAD.ROOT_DIR_NAME,
);

export const toPosixPath = (p: string): string => p.replace(/\\/g, "/");
