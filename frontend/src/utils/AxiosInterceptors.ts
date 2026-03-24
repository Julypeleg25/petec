import axios, { AxiosError, AxiosRequestConfig, Method } from "axios";
import { BASE_URL, globals } from "./Globals";
import { navigateToLogin, setTokens } from "./AuthUtils";
import toast from "react-hot-toast";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

interface RetirableAxiosRequestConfig extends AxiosRequestConfig {
  _retry: boolean;
}

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetirableAxiosRequestConfig;

    // If the request fails due to an expired access token and a refresh token is available
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken && !originalRequest._retry) {
        try {
          const response = await axios.post(globals.auth.refreshToken, {
            refreshToken,
          });
          const newAccessToken = response.data.accessToken;
          const newRefreshToken = response.data.refreshToken;
          setTokens(newAccessToken, newRefreshToken);

          // Retry the original request with the new access token
          if (originalRequest?.headers)
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          originalRequest._retry = true;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          navigateToLogin();
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.clear();
        navigateToLogin();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const makeRequest = async (
  method: Method,
  url: string,
  body?: any,
  isLoading?: boolean,
  afterSuccess?: (res: any) => void,
  afterError?: (err: any) => void,
  requestOptions?: any,
  loadingMessage?: string,
  successMessage?: string,
  errorMessage?: string
) => {
  if (isLoading) {
    return toast
      .promise(
        axiosInstance({
          method,
          url,
          data: body,
          ...requestOptions,
        }).catch(async (err) => {
          const contentType = err.response.headers["content-type"];
          if (
            contentType.includes("application/json") &&
            !err.response.data.error
          ) {
            // Convert blob to JSON
            await err.response.data.text().then((text: any) => {
              const json = JSON.parse(text);
              err.response.data = { error: json.error };
            });
          }

          throw err;
        }),
        {
          loading: loadingMessage || "...מבצע פעולה",
          success: (res) => {
            if (afterSuccess) afterSuccess(res);
            return successMessage || "הפעולה בוצעה בהצלחה";
          },
          error: (err) => {
            if (afterError) afterError(err);
            return errorMessage || err.response.data.error || "הפעולה נכשלה";
          },
        }
      )
      .then((res) => res)
      .catch((err) => err);
  } else {
    return axiosInstance({
      method,
      url,
      data: body,
      ...requestOptions,
    })
      .then((res) => {
        if (afterSuccess) afterSuccess(res);
        return res;
      })
      .catch((err) => {
        if (afterError) afterError(err);
        console.log(err);
      });
  }
};

export default axiosInstance;
