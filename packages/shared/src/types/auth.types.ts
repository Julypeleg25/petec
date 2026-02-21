export interface AuthenticatedUser {
  userId: string;
  role: string;
  privileges: string[];
}

export interface TokenPayload {
  userId: string;
  role: string;
  privileges: string[];
  iat?: number;
  exp?: number;
}
