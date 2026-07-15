import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type Method,
} from "axios";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  STORAGE_KEYS,
  HttpStatus,
  ApiResponse,
  RefreshResponseDTO,
  RefreshResponseSchema,
  type ApiErrorPayload,
} from "@petec/shared";
import { API_ROUTES } from "../config/apiRoutes";
import { AppRoutes } from "../config/appRoutes";
import { ENV } from "../config/config";
import { logger } from "./logger";
import type { RetryableConfig } from "./apiClient.types";
import { toHebrewErrorMessage } from "./errorMessages";

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let memoryAccessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

const getAccessToken = (): string | null => memoryAccessToken;

const setAccessToken = (token: string): void => {
  memoryAccessToken = token;
};

const clearStoredAuth = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
  localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
};

const clearAuth = (): void => {
  memoryAccessToken = null;
  clearStoredAuth();
};

const redirectToLogin = (): void => {
  window.location.replace(AppRoutes.Login);
};

const AUTH_REFRESH_EXCLUDED_PATHS = [
  API_ROUTES.auth.login,
  API_ROUTES.auth.refresh,
  API_ROUTES.auth.forgotPassword,
  API_ROUTES.auth.resetPassword,
  API_ROUTES.auth.logout,
] as const;

const shouldAttemptRefresh = (requestUrl: string): boolean =>
  !AUTH_REFRESH_EXCLUDED_PATHS.some((path) => requestUrl.includes(path));

const isApiSuccessResponse = <TResponse>(
  payload: ApiResponse<TResponse> | unknown,
): payload is { success: true; data: TResponse } =>
  Boolean(
    payload &&
      typeof payload === "object" &&
      "success" in payload &&
      payload.success === true &&
      "data" in payload,
  );

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.debug(`API Request: [${config.method?.toUpperCase()}] ${config.url}`, config.data);
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    if (isApiSuccessResponse(response.data)) {
      response.data = response.data.data;
    }
    logger.info(`API Response Success: [${response.config.method?.toUpperCase()}] ${response.config.url}`);
    return response;
  },
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    const requestUrl =
      typeof originalRequest?.url === "string" ? originalRequest.url : "";

    logger.error(`API Request Failed: [${originalRequest?.method?.toUpperCase() || "UNKNOWN"}] ${requestUrl}`, error, {
      status: error.response?.status,
      responseData: error.response?.data ?? null,
    });

    if (
      error.response?.status === HttpStatus.UNAUTHORIZED &&
      originalRequest &&
      !originalRequest._retry &&
      shouldAttemptRefresh(requestUrl)
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post<ApiResponse<RefreshResponseDTO>>(
              ENV.API_URL + API_ROUTES.auth.refresh,
              {},
              { withCredentials: true },
            )
            .then((refreshResponse) => {
              const parsed = isApiSuccessResponse(refreshResponse.data)
                ? RefreshResponseSchema.safeParse(refreshResponse.data.data)
                : null;
              const token = parsed?.success ? parsed.data.accessToken : undefined;
              if (!token) {
                throw new Error("לא התקבל אסימון גישה חדש מהשרת");
              }
              setAccessToken(token);
              return token;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export { clearAuth, setAccessToken, getAccessToken };

const extractErrorMsg = (err: AxiosError<ApiErrorPayload>): string =>
  toHebrewErrorMessage(err);

export const makeRequest = async <TBody = Record<string, never>>(
  method: Method,
  url: string,
  body?: TBody,
  isLoading?: boolean,
  afterSuccess?: (res: AxiosResponse) => void,
  afterError?: (err: AxiosError<ApiErrorPayload>) => void,
  requestOptions?: AxiosRequestConfig,
  loadingMessage?: string,
  successMessage?: string,
  errorMessage?: string,
): Promise<AxiosResponse | void> => {
  const config: AxiosRequestConfig = {
    method,
    url,
    data: body,
    ...requestOptions,
  };

  if (isLoading) {
    return toast
      .promise(apiClient(config), {
        loading: loadingMessage ?? "...מבצע פעולה",
        success: (res) => {
          if (afterSuccess) afterSuccess(res);
          return successMessage ?? "הפעולה בוצעה בהצלחה";
        },
        error: (err: AxiosError<ApiErrorPayload>) => {
          if (afterError) afterError(err);
          return errorMessage ?? extractErrorMsg(err);
        },
      })
      .then((res) => res)
      .catch(() => undefined);
  }

  return apiClient(config)
    .then((res) => {
      if (afterSuccess) afterSuccess(res);
      return res;
    })
    .catch((err: AxiosError<ApiErrorPayload>) => {
      if (afterError) afterError(err);
    });
};

export const requestWithSchema = async <TResponse>(
  config: AxiosRequestConfig,
  responseSchema: z.ZodType<TResponse>,
): Promise<TResponse> => {
  const response = await apiClient.request<TResponse>(config);
  return responseSchema.parse(response.data);
};

export const requestWithRequestAndResponseSchema = async <TRequest, TResponse>(
  config: AxiosRequestConfig,
  requestBody: TRequest,
  requestSchema: z.ZodType<TRequest>,
  responseSchema: z.ZodType<TResponse>,
): Promise<TResponse> => {
  const parsedBody = requestSchema.parse(requestBody);
  const response = await apiClient.request<TResponse>({
    ...config,
    data: parsedBody,
  });
  return responseSchema.parse(response.data);
};

export const requestWithRequestSchemaNoContent = async <TRequest>(
  config: AxiosRequestConfig,
  requestBody: TRequest,
  requestSchema: z.ZodType<TRequest>,
): Promise<void> => {
  const parsedBody = requestSchema.parse(requestBody);
  await apiClient.request({ ...config, data: parsedBody });
};

export const requestNoContent = async (
  config: AxiosRequestConfig,
): Promise<void> => {
  await apiClient.request(config);
};

export const requestFormDataWithResponseSchema = async <TResponse>(
  config: AxiosRequestConfig,
  formData: FormData,
  responseSchema: z.ZodType<TResponse>,
): Promise<TResponse> => {
  const response = await apiClient.request<TResponse>({
    ...config,
    data: formData,
    headers: {
      ...config.headers,
      "Content-Type": undefined,
    },
  });
  return responseSchema.parse(response.data);
};

export const requestBlob = async (
  config: AxiosRequestConfig,
): Promise<Blob> => {
  const response = await apiClient.request<Blob>({
    ...config,
    responseType: "blob",
  });
  return response.data;
};

export const getValForFormData = <T>(val: T): T | null =>
  val === null || val === undefined || String(val) === "" ? null : val;
