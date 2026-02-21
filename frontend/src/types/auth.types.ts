import type { Role } from "@petec/shared";

export interface AuthUser {
  userId: string;
  username: string;
  role: Role;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
}
