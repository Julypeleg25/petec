import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { AppRoutes } from "../../config/appRoutes";

import { ProtectedRouteProps } from "./ProtectedRoute.types";

export function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={AppRoutes.Login} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={AppRoutes.Unauthorized} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
