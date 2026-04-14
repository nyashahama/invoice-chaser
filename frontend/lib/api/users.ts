import { apiClient } from "./client";
import type { ApiUser } from "./types";

export function getCurrentUser() {
  return apiClient.get<ApiUser>("/api/v1/users/me");
}
