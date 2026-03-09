import { TABLE_SEARCH_FILTER_KEYS } from "@petec/shared";

export type PatientCardsFilter = Record<string, string | boolean>;

export const buildPatientsArgs = (
    showOnlyWithAlerts: boolean,
    isArchive: boolean,
): string[] => [
        String(showOnlyWithAlerts),
        String(showOnlyWithAlerts),
        String(isArchive),
    ];

export const buildCaseSearchFilters = (
    rawValue: string,
    isArchive: boolean,
): PatientCardsFilter => {
    const filters: PatientCardsFilter = { isArchived: isArchive };
    const value = rawValue.trim();
    if (!value) {
        return filters;
    }
    filters[TABLE_SEARCH_FILTER_KEYS.SEARCH] = value;
    return filters;
};

export const formatOwnerPhone = (phone?: string): string => {
    if (!phone || phone.length <= 3) {
        return "";
    }
    return `${phone.substring(0, 3)}-${phone.substring(3)}`;
};

export const getButtonClassName = (isCurrent: boolean): string =>
    isCurrent ? "btn" : "btn btn-active";

export const getInitialViewportWidth = (): number =>
    typeof window === "undefined"
        ? 0
        : window.innerWidth;

export const getCaseSerialPrefix = (
    serialId?: string | null,
): string => {
    if (!serialId) {
        return "";
    }

    const normalized = serialId.trim();
    if (normalized.length === 0) {
        return "";
    }

    const [prefix] = normalized.split("-");
    return prefix && prefix.length > 0 ? prefix : normalized;
};
