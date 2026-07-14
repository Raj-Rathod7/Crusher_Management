import { apiClient } from "../common/api";
import type { AuthResponse } from "../models";

export const login = async (username: string, password: string) => {
  return apiClient.post<AuthResponse>("/auth/login", {username, password}, {auth: false});
}