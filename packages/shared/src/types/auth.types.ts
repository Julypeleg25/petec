import type { Role } from "../constants/auth.constants.js";

export interface AuthenticatedUser {
  userId: string;
  role: Role;
  privileges: string[];
}

export interface TokenPayload {
  userId: string;
  role: Role;
  privileges: string[];
  username?: string;
  fullName?: string;
  iat?: number;
  exp?: number;
}

export interface ResetPasswordTokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}
