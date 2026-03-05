import { ROUTES } from "@petec/shared";

const ABSOLUTE_OR_DATA_URL_REGEX = /^(https?:\/\/|data:)/i;

const toPhotoVersion = (updatedAt?: Date | string): number | undefined => {
    if (updatedAt instanceof Date) {
        const timestamp = updatedAt.getTime();
        return Number.isFinite(timestamp) ? timestamp : undefined;
    }
    if (typeof updatedAt === "string") {
        const timestamp = new Date(updatedAt).getTime();
        return Number.isFinite(timestamp) ? timestamp : undefined;
    }
    return undefined;
};

export const toPatientPhotoUrl = (
    patientId: string | undefined,
    photoName: string | undefined,
    updatedAt?: Date | string,
): string | null => {
    if (!photoName) return null;
    const trimmedPhotoName = photoName.trim();
    if (!trimmedPhotoName) return null;

    if (
        trimmedPhotoName.startsWith("/assets/") ||
        ABSOLUTE_OR_DATA_URL_REGEX.test(trimmedPhotoName) ||
        trimmedPhotoName.startsWith(ROUTES.PATIENT)
    ) {
        return trimmedPhotoName;
    }

    if (!patientId) {
        return null;
    }

    const version = toPhotoVersion(updatedAt);
    return version !== undefined
        ? `${ROUTES.PATIENT}/photo/${patientId}?v=${version}`
        : `${ROUTES.PATIENT}/photo/${patientId}`;
};

