import { apiClient } from "./client";
import type { ApiUser, ChangePasswordInput, UpdateUserInput } from "./types";

export function getCurrentUser() {
  return apiClient.get<ApiUser>("/api/v1/users/me");
}

export function updateCurrentUser(input: UpdateUserInput) {
  return apiClient.patch<ApiUser>("/api/v1/users/me", input);
}

export function changePassword(input: ChangePasswordInput) {
  return apiClient.post<void>("/api/v1/users/me/password", input);
}
