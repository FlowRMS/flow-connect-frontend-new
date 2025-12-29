// Type definitions for authentication

export interface TokenData {
  access_token: string;
  refresh_token?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface LoginFormData {
  access_token: string;
  refresh_token: string;
}

export interface AuthError {
  message: string;
  code?: string;
}