import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import { roles, STORAGE_KEYS, type Role, type TokenPayload } from "@petec/shared";
import { clearAuth, setAccessToken } from "../../lib/apiClient";
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
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }

  // Legacy fallback
  const legacyUserId = localStorage.getItem(STORAGE_KEYS.USER_ID)?.trim() ?? "";
  const legacyRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
  if (legacyUserId && isRole(legacyRole)) {
    return normalizeAuthUser({
      userId: legacyUserId,
      role: legacyRole,
      username: "",
      fullName: "",
    });
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

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const stored = readAuthUserFromStorage();
      if (!cancelled && stored) setUser(stored);

      try {
        const refresh = await authApi.refresh();
        const token = refresh.accessToken;

        if (!token) {
          if (!cancelled) {
            // No token returned: keep stored user if any, otherwise clear
            if (!stored) {
              clearAuth();
              setUser(null);
              writeAuthUserToStorage(null);
            }
          }
          return;
        }

        setAccessToken(token);
        const nextUser = buildUserFromToken(token, stored);

        if (!cancelled) {
          if (nextUser) {
            setUser(nextUser);
            writeAuthUserToStorage(nextUser);
          } else if (!stored) {
            clearAuth();
            setUser(null);
            writeAuthUserToStorage(null);
          }
        }
      } catch (error) {
        const status = getHttpStatus(error as HttpErrorLike);

        if (!cancelled) {
          if (status === 401 || status === 403) {
            clearAuth();
            setUser(null);
            writeAuthUserToStorage(null);
          } else {
            // transient failure: keep stored user as best-effort
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
  }, []);

  const login = useCallback((response: LoginResponseDTO) => {
    const { accessToken, user: responseUser } = response;
    setAccessToken(accessToken);

    // Prefer decoded token (authoritative), fallback to response payload
    const fromToken = buildUserFromToken(accessToken, null);

    const fallback: AuthUser = normalizeAuthUser({
      userId: responseUser.id,
      role: isRole(responseUser.role) ? responseUser.role : roles.ASSISTANT,
      username: responseUser.username,
      fullName: responseUser.fullName ?? responseUser.username,
    });

    const next = fromToken ?? fallback;
    setUser(next);
    writeAuthUserToStorage(next);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    writeAuthUserToStorage(null);
  }, []);

  const updateUser = useCallback((updated: AuthUser) => {
    const normalized = normalizeAuthUser(updated);
    setUser(normalized);
    writeAuthUserToStorage(normalized);
  }, []);

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
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
