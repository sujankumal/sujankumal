import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type RegisterAccountPayload = {
  name: string;
  email: string;
  password: string;
  captchaToken: string;
};

export type ForgotPasswordPayload = {
  email: string;
  captchaToken: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  password: string;
  captchaToken: string;
};

export type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export async function registerAccount(payload: RegisterAccountPayload): Promise<ApiResponse> {
  return apiClient<ApiResponse>(API_ENDPOINTS.auth.register, {
    method: "POST",
    body: payload,
  });
}

export async function requestPasswordReset(payload: ForgotPasswordPayload): Promise<ApiResponse> {
  return apiClient<ApiResponse>(API_ENDPOINTS.auth.forgotPassword, {
    method: "POST",
    body: payload,
  });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse> {
  return apiClient<ApiResponse>(API_ENDPOINTS.auth.resetPassword, {
    method: "POST",
    body: payload,
  });
}
