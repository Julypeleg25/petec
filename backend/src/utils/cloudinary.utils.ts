import path from "node:path";
import { randomUUID } from "crypto";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import { ENV } from "../config/config.js";
import { logger } from "../config/logger.js";
import { BadRequestError } from "../constants/error.constants.js";
import { UPLOAD } from "@petec/shared";
import { sanitizeUploadedFileName } from "./uploadFile.utils.js";

type CloudinaryUploadFolder =
  | typeof UPLOAD.PATIENT_PHOTOS_DIR
  | typeof UPLOAD.PATIENT_DOCUMENTS_DIR;

type UploadToCloudinaryParams = Readonly<{
  buffer: Buffer;
  originalName: string;
  folder: CloudinaryUploadFolder;
  fallbackBaseName: string;
}>;

export type CloudinaryUploadResult = Readonly<{
  secureUrl: string;
  publicId: string;
}>;

let isCloudinaryConfigured = false;

const configureCloudinary = () => {
  if (isCloudinaryConfigured) {
    return;
  }
  if (
    ENV.cloudinaryCloudName.length === 0
    || ENV.cloudinaryApiKey.length === 0
    || ENV.cloudinaryApiSecret.length === 0
  ) {
    throw new BadRequestError("Cloudinary is not configured");
  }

  cloudinary.config({
    cloud_name: ENV.cloudinaryCloudName,
    api_key: ENV.cloudinaryApiKey,
    api_secret: ENV.cloudinaryApiSecret,
  });
  isCloudinaryConfigured = true;
};

const buildCloudinaryPublicId = (
  folder: CloudinaryUploadFolder,
  originalName: string,
  fallbackBaseName: string,
): string => {
  const safeFileName = sanitizeUploadedFileName(originalName, fallbackBaseName);
  const parsedName = path.parse(safeFileName).name.trim();
  const baseName = parsedName.length > 0 ? parsedName : fallbackBaseName;
  const uniqueSuffix = randomUUID().replace(/-/g, "");

  return `${folder}/${baseName}-${uniqueSuffix}`;
};

const extractCloudinaryPublicIdFromUrl = (value: string): string | null => {
  if (!value.startsWith("http")) {
    return value.trim().length > 0 ? value.trim() : null;
  }

  try {
    const parsedUrl = new URL(value);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.findIndex((segment) => segment === "upload");
    if (uploadIndex < 0) {
      return null;
    }

    let publicIdSegments = segments.slice(uploadIndex + 1);
    const versionIndex = publicIdSegments.findIndex((segment) =>
      /^v\d+$/.test(segment)
    );
    if (versionIndex >= 0) {
      publicIdSegments = publicIdSegments.slice(versionIndex + 1);
    }
    if (publicIdSegments.length === 0) {
      return null;
    }

    const lastSegment = publicIdSegments[publicIdSegments.length - 1];
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(
      /\.[^.]+$/,
      "",
    );

    return publicIdSegments.join("/");
  } catch {
    return null;
  }
};

export const uploadToCloudinary = async (
  params: UploadToCloudinaryParams,
): Promise<CloudinaryUploadResult> => {
  const { buffer, originalName, folder, fallbackBaseName } = params;
  try {
    configureCloudinary();
    const publicId = buildCloudinaryPublicId(
      folder,
      originalName,
      fallbackBaseName,
    );

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          public_id: publicId,
        },
        (error: unknown, result: UploadApiResponse | undefined) => {
          if (error) {
            logger.error("Error uploading image to Cloudinary", { error });
            return reject(new Error("Error uploading image to Cloudinary"));
          }
          if (!result?.secure_url || !result.public_id) {
            return reject(new Error("Cloudinary upload did not return asset metadata"));
          }
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  } catch (error) {
    logger.error("Error processing Cloudinary upload", { error });
    throw error;
  }
};

export const deleteFromCloudinary = async (publicIdOrUrl: string): Promise<void> => {
  try {
    configureCloudinary();

    const publicId = extractCloudinaryPublicIdFromUrl(publicIdOrUrl);
    if (!publicId) {
      logger.warn("Skipping Cloudinary delete because public id could not be resolved", {
        public_id_or_url: publicIdOrUrl,
      });
      return;
    }

    await cloudinary.uploader.destroy(publicId);
    logger.info("Deleted image from Cloudinary", { publicId });
  } catch (error) {
    logger.error("Error deleting image from Cloudinary", {
      error,
      publicIdOrUrl,
    });
  }
};
