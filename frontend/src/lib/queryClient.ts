import { QueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { HttpStatus, type ApiErrorPayload } from "@petec/shared";
import { toHebrewErrorMessage } from "./errorMessages";

const isClientError = (error: Error | AxiosError | null): boolean => {
    if (!error) return false;
    const status = (error as AxiosError)?.response?.status;
    return (
        status !== undefined &&
        status >= HttpStatus.BAD_REQUEST &&
        status < HttpStatus.INTERNAL_SERVER_ERROR
    );
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
            onError: (error: Error | AxiosError<ApiErrorPayload>) => {
                toast.error(toHebrewErrorMessage(error));
            },
        },
    },
});
