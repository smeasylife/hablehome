import { apiClient, refreshCsrfToken, resetCsrfToken } from "./client";

export type AuthMember = {
  memberId: number;
  nickname: string;
  email: string;
  role: "ROLE_USER" | "ROLE_ADMIN";
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  nickname: string;
  email: string;
  password: string;
  phoneNumber: string;
};

export type VerifyCodePayload = {
  email: string;
  code: string;
};

export type KakaoLoginPayload = {
  code: string;
  redirectUri: string;
};

export async function login(payload: LoginPayload): Promise<AuthMember> {
  const response = await apiClient.post<AuthMember>("/auth/login", payload);
  await refreshCsrfToken();

  return response.data;
}

export async function getCurrentMember(): Promise<AuthMember> {
  const response = await apiClient.get<AuthMember>("/auth/me");

  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
  resetCsrfToken();
}

export async function sendSignupCode(email: string): Promise<string> {
  const response = await apiClient.post<string>("/signup/send-code", null, {
    params: { email },
    timeout: 30000,
  });

  return response.data;
}

export async function verifySignupCode(
  payload: VerifyCodePayload,
): Promise<string> {
  const response = await apiClient.post<string>("/signup/verify-code", payload);

  return response.data;
}

export async function signup(payload: SignupPayload): Promise<void> {
  await apiClient.post("/signup", payload);
}

export async function kakaoLogin(payload: KakaoLoginPayload): Promise<AuthMember> {
  const response = await apiClient.post<AuthMember>("/auth/kakao/login", payload);
  await refreshCsrfToken();

  return response.data;
}
