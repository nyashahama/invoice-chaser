import { apiClient } from "./client";
import type {
  AuthResponse,
  LoginInput,
  RefreshTokenResponse,
  RegisterInput,
} from "./types";

export function login(input: LoginInput) {
  return apiClient.post<AuthResponse>("/api/v1/auth/login", input, {
    skipAuthRefresh: true,
  });
}

export function register(input: RegisterInput) {
  return apiClient.post<AuthResponse>("/api/v1/auth/register", input, {
    skipAuthRefresh: true,
  });
}

export function refreshAccessToken() {
  return apiClient.refreshAccessToken() as Promise<RefreshTokenResponse["access_token"]>;
}

export function logout() {
  return apiClient.post<void>("/api/v1/auth/logout", undefined, {
    skipAuthRefresh: true,
  });
}
