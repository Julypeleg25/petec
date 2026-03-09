export interface AuthenticatedUser {
  userId: string;
  role: string;
  privileges: string[];
}

export interface TokenPayload {
  userId: string;
  role: string;
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
