import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

type CsrfTokenResponse = {
  headerName: string;
  parameterName: string;
  token: string;
};

type ApiErrorResponse = {
  code?: string;
  message?: string;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _csrfRetry?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://hablehome.store/";

export function resolveApiAssetUrl(url?: string | null) {
  if (!url) {
    return "";
  }

  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  return new URL(url, API_BASE_URL).toString();
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  withCredentials: true,
});

const csrfClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  withCredentials: true,
});

let csrfTokenPromise: Promise<CsrfTokenResponse> | null = null;

export function resetCsrfToken() {
  csrfTokenPromise = null;
}

export function ensureCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = csrfClient
      .get<CsrfTokenResponse>("/auth/csrf")
      .then((response) => response.data)
      .catch((error) => {
        csrfTokenPromise = null;
        throw error;
      });
  }

  return csrfTokenPromise;
}

export function refreshCsrfToken() {
  resetCsrfToken();

  return ensureCsrfToken();
}

function needsCsrfToken(method?: string) {
  return ["post", "put", "patch", "delete"].includes(
    method?.toLowerCase() ?? "",
  );
}

function isCsrfError(error: AxiosError<ApiErrorResponse>) {
  return (
    error.response?.status === 403 &&
    error.response.data?.code === "CSRF_TOKEN_INVALID"
  );
}

apiClient.interceptors.request.use(async (config) => {
  if (needsCsrfToken(config.method) && config.url !== "/auth/csrf") {
    const csrfToken = await ensureCsrfToken();
    const headers = AxiosHeaders.from(config.headers);
    headers.set(csrfToken.headerName, csrfToken.token);
    config.headers = headers;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (
      isCsrfError(error) &&
      originalRequest &&
      !originalRequest._csrfRetry &&
      needsCsrfToken(originalRequest.method)
    ) {
      originalRequest._csrfRetry = true;
      await refreshCsrfToken();
      return apiClient.request(originalRequest);
    }

    return Promise.reject(error);
  },
);
