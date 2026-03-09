import type { InternalAxiosRequestConfig } from "axios";

export interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
