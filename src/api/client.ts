import axios, { AxiosHeaders } from "axios";
import { getCurrentSession } from "../data/localSession";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  timeout: 5000,
});

apiClient.interceptors.request.use((config) => {
  const session = getCurrentSession();

  if (session) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("X-Member-Id", String(session.memberId));
    config.headers = headers;
  }

  return config;
});
