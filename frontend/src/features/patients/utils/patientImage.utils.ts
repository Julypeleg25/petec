import {
    DEFAULT_PATIENT_IMAGE,
    toHighResolutionCloudinaryUrl,
    UPLOAD,
} from "@petec/shared";
import { ENV } from "../../../config/config";
import type { SyntheticEvent } from "react";

const ABSOLUTE_OR_DATA_URL_REGEX = /^(https?:\/\/|data:)/i;
const API_PATH_PREFIX = "/api/";
const ROOT_PATH_PREFIX = "/";
const STORAGE_PATH_PREFIX = UPLOAD.PATIENT_PHOTOS_PREFIX;
const FALLBACK_DATASET_KEY = "fallbackApplied";
const FALLBACK_DATASET_VALUE = "1";

export const resolvePatientImageSrc = (
    value?: string | null,
): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith(STORAGE_PATH_PREFIX)) {
        return null;
    }

    if (ABSOLUTE_OR_DATA_URL_REGEX.test(trimmed)) {
        return toHighResolutionCloudinaryUrl(trimmed);
    }

    if (trimmed.startsWith(API_PATH_PREFIX)) {
        return `${ENV.API_URL}${trimmed}`;
    }

    if (trimmed.startsWith(ROOT_PATH_PREFIX)) {
        return trimmed;
    }

    return null;
};

export const getPatientImageSrc = (value?: string | null): string =>
    resolvePatientImageSrc(value) ?? DEFAULT_PATIENT_IMAGE;

export const handlePatientImageLoadError = (
    event: SyntheticEvent<HTMLImageElement>,
): void => {
    const image = event.currentTarget;
    if (image.dataset[FALLBACK_DATASET_KEY] === FALLBACK_DATASET_VALUE) {
        return;
    }

    image.dataset[FALLBACK_DATASET_KEY] = FALLBACK_DATASET_VALUE;
    image.src = DEFAULT_PATIENT_IMAGE;
};
