import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import { STORAGE_KEYS, type Role, type TokenPayload } from "@petec/shared";
import { clearAuth, setAccessToken } from "../../lib/api-client";
import type { AuthUser } from "../../types";
import type { LoginResponseDTO } from "@petec/shared";
import { authApi } from "./auth.api";
import type { AuthContextValue } from "./AuthProvider.types";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      try {
        const refresh = await authApi.refresh();
        const token = refresh.accessToken;
        if (token) {
          setAccessToken(token);
          const payload = jwtDecode<TokenPayload & { username?: string }>(token);
          const userId = payload.userId ?? localStorage.getItem(STORAGE_KEYS.USER_ID) ?? "";
          const role = (payload.role as Role) ?? (localStorage.getItem(STORAGE_KEYS.USER_ROLE) as Role | null) ?? "";
          if (userId && role) {
            setUser({
              userId,
              username: payload.username ?? "",
              role,
            });
          }
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    initAuth().catch(() => { setIsLoading(false); });
  }, []);

  const login = useCallback((response: LoginResponseDTO) => {
    const { accessToken, user: responseUser } = response;

    setAccessToken(accessToken);

    let decodedUserId = responseUser.id;
    let decodedRole = responseUser.role as Role;
    let decodedUsername = responseUser.username;

    try {
      const payload = jwtDecode<TokenPayload & { username?: string }>(accessToken);
      decodedUserId = payload.userId ?? responseUser.id;
      decodedRole = (payload.role as Role) ?? decodedRole;
      decodedUsername = payload.username ?? decodedUsername;
    } catch {
    }

    localStorage.setItem(STORAGE_KEYS.USER_ID, decodedUserId);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, decodedRole);

    const authUser: AuthUser = {
      userId: decodedUserId,
      username: decodedUsername,
      role: decodedRole,
    };

    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: AuthUser) => {
    setUser(updated);
    localStorage.setItem(STORAGE_KEYS.USER_ID, updated.userId);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, updated.role);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout, updateUser }),
    [user, isLoading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
