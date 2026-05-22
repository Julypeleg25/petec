import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import {
  HttpStatus,
  roles,
  STORAGE_KEYS,
  type Role,
  type TokenPayload,
} from "@petec/shared";
import {
  clearAuth,
  setAccessToken,
} from "../../lib/apiClient";
import type { AuthUser } from "../../types";
import type { LoginResponseDTO } from "@petec/shared";
import { authApi } from "./auth.api";
import type { AuthContextValue } from "./AuthProvider.types";

const AuthContext = createContext<AuthContextValue | null>(null);
type HttpErrorLike = {
  response?: {
    status?: number | null;
  };
} | null | undefined;

const isRole = (value: string | null | undefined): value is Role =>
  typeof value === "string" && Object.values(roles).includes(value as Role);

const normalizeAuthUser = (user: AuthUser): AuthUser => {
  const fullName = user.fullName.trim().length > 0 ? user.fullName : user.username;
  return { ...user, fullName };
};

const parseStoredUser = (raw: string): AuthUser | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    const userId = typeof parsed.userId === "string" ? parsed.userId.trim() : "";
    const role = isRole(parsed.role) ? parsed.role : null;
    if (!userId || !role) return null;

    const username = typeof parsed.username === "string" ? parsed.username : "";
    const fullName = typeof parsed.fullName === "string" ? parsed.fullName : "";
    return normalizeAuthUser({ userId, role, username, fullName });
  } catch {
    return null;
  }
};

const readAuthUserFromStorage = (): AuthUser | null => {
  const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
  if (raw) {
    const parsed = parseStoredUser(raw);
    if (parsed) return parsed;
    clearAuth();
  }

  return null;
};

const writeAuthUserToStorage = (user: AuthUser | null): void => {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    return;
  }

  const normalized = normalizeAuthUser(user);
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(normalized));
  localStorage.setItem(STORAGE_KEYS.USER_ID, normalized.userId);
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, normalized.role);
};

const getHttpStatus = (error: HttpErrorLike): number | null => {
  const status = error?.response?.status;
  return typeof status === "number" ? status : null;
};

const buildUserFromToken = (token: string, fallback?: AuthUser | null): AuthUser | null => {
  try {
    const payload = jwtDecode<TokenPayload>(token);

    const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";
    const role = isRole(payload.role) ? payload.role : fallback?.role ?? null;

    if (!userId || !role) return null;

    const username =
      typeof payload.username === "string" ? payload.username : fallback?.username ?? "";
    const fullName =
      typeof payload.fullName === "string"
        ? payload.fullName
        : fallback?.fullName ?? username;

    return normalizeAuthUser({ userId, role, username, fullName });
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readAuthUserFromStorage());
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = useCallback((nextUser: AuthUser) => {
    const normalized = normalizeAuthUser(nextUser);
    setUser(normalized);
    writeAuthUserToStorage(normalized);
  }, []);

  const clearUser = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const stored = readAuthUserFromStorage();
      if (!cancelled && stored) setUser(stored);

      try {
        const refresh = await authApi.refresh();
        const token = refresh.accessToken;

        if (!token) {
          if (!cancelled && !stored) clearUser();
          return;
        }

        setAccessToken(token);
        const nextUser = buildUserFromToken(token, stored);

        if (!cancelled) {
          if (nextUser) {
            persistUser(nextUser);
          } else if (!stored) {
            clearUser();
          }
        }
      } catch (error) {
        const status = getHttpStatus(error as HttpErrorLike);

        if (!cancelled) {
          if (
            status === HttpStatus.UNAUTHORIZED ||
            status === HttpStatus.FORBIDDEN
          ) {
            clearUser();
          } else {
            setUser(stored ?? null);
            writeAuthUserToStorage(stored ?? null);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init().catch(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [clearUser, persistUser]);

  const login = useCallback((response: LoginResponseDTO) => {
    const { accessToken, user: responseUser } = response;
    setAccessToken(accessToken);

    const fromToken = buildUserFromToken(accessToken, null);

    const fallback: AuthUser = normalizeAuthUser({
      userId: responseUser.id,
      role: isRole(responseUser.role) ? responseUser.role : roles.ASSISTANT,
      username: responseUser.username,
      fullName: responseUser.fullName ?? responseUser.username,
    });

    const next = fromToken ?? fallback;
    persistUser(next);
  }, [persistUser]);

  const logout = useCallback(() => {
    clearUser();
  }, [clearUser]);

  const updateUser = useCallback((updated: AuthUser) => {
    persistUser(updated);
  }, [persistUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      updateUser,
    }),
    [user, isLoading, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("יש להשתמש ב-useAuth בתוך AuthProvider");
  return ctx;
}
