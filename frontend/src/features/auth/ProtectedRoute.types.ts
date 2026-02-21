import type { Role } from "@petec/shared";

export interface ProtectedRouteProps {
    allowedRoles?: Role[];
    children?: React.ReactNode;
}
