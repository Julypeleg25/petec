import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";

import { ProtectedRouteProps } from "./ProtectedRoute.types";

/**
 * Route guard: redirects unauthenticated users to /login.
 * We rely on React context state and the `isLoading` flag to avoid
 * racing the initial async token hydration rather than checking storage,
 * as our access token is kept in-memory to prevent XSS.
 */
export function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Don't redirect while hydrating auth
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Supports both wrapper-style (<ProtectedRoute><Child/></ProtectedRoute>)
  // and layout route style (no children → renders <Outlet>)
  return children ? <>{children}</> : <Outlet />;
}
