import { apiClient } from "./client";

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

export async function sendSignupCode(email: string): Promise<string> {
  const response = await apiClient.post<string>("/signup/send-code", null, {
    params: { email },
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

export async function kakaoLogin(code: string): Promise<string> {
  const response = await apiClient.post<string>("/auth/kakao/login", { code });

  return response.data;
}
