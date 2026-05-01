import axios, { AxiosHeaders } from "axios";

type CsrfTokenResponse = {
  headerName: string;
  parameterName: string;
  token: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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

function needsCsrfToken(method?: string) {
  return ["post", "put", "patch", "delete"].includes(
    method?.toLowerCase() ?? "",
  );
}

async function getCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = csrfClient
      .get<CsrfTokenResponse>("/auth/csrf")
      .then((response) => response.data);
  }

  return csrfTokenPromise;
}

apiClient.interceptors.request.use(async (config) => {
  if (needsCsrfToken(config.method) && config.url !== "/auth/csrf") {
    const csrfToken = await getCsrfToken();
    const headers = AxiosHeaders.from(config.headers);
    headers.set(csrfToken.headerName, csrfToken.token);
    config.headers = headers;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      csrfTokenPromise = null;
    }

    return Promise.reject(error);
  },
);
