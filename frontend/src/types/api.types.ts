import type { AxiosError } from "axios";
import type { ApiErrorPayload } from "@petec/shared";

export type TypedAxiosError = AxiosError<ApiErrorPayload>;
