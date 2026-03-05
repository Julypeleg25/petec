import { QueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import type { ApiErrorPayload } from "@petec/shared";

// Assume the catch parameter will eventually pass AxiosError
const extractErrorMessage = (error: Error | AxiosError<ApiErrorPayload> | null): string => {
    if (!error) return "הפעולה נכשלה";

    const axiosError = error as AxiosError<ApiErrorPayload>;
    const errData = axiosError?.response?.data?.error;
    if (typeof errData === "string") return errData;
    if (typeof errData === "object" && errData?.message) return errData.message;
    return error.message || "הפעולה נכשלה";
};

const isClientError = (error: Error | AxiosError | null): boolean => {
    if (!error) return false;
    const status = (error as AxiosError)?.response?.status;
    return status !== undefined && status >= 400 && status < 500;
};

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2,
            retry: (failureCount, error) => {
                if (isClientError(error)) return false;
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
        },
        mutations: {
            onError: (error) => {
                toast.error(extractErrorMessage(error));
            },
        },
    },
});
