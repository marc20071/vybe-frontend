import { apiRequest } from "@/services/api-client";
import type { User } from "@/types/user";
export const authApi = {
  me: () => apiRequest<{ user: User | null }>("/auth/me"),
  login: (input: { email: string; password: string }) => apiRequest<{ user: User }>("/auth/login", { method: "POST", json: input }),
  signup: (input: { displayName: string; username: string; email: string; password: string }) => apiRequest<{ user: User | null; needsEmailConfirmation: boolean }>("/auth/signup", { method: "POST", json: input }),
  resendConfirmation: (email: string) => apiRequest<void>("/auth/resend-confirmation", { method: "POST", json: { email } }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) => apiRequest<void>("/auth/forgot-password", { method: "POST", json: { email } }),
  resetPassword: (accessToken: string, password: string) => apiRequest<{ success: boolean }>("/auth/reset-password", { method: "POST", json: { accessToken, password } }),
};
