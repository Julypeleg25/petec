import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@utils/authTokens";
import { AuthError, ForbiddenError } from "@utils/errors";
import type { AuthenticatedUser } from "@petec/shared";
import { ROLE_PERMISSIONS, Permission, Role } from "@petec/shared";

declare global {
    namespace Express {
        interface Request {
            authenticatedUser?: AuthenticatedUser;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    void res;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        next(new AuthError("Missing or invalid authorization header"));
        return;
    }

    const token = authHeader.slice("Bearer ".length);

    try {
        const decoded = verifyAccessToken(token);
        req.authenticatedUser = {
            userId: decoded.userId,
            role: decoded.role,
            privileges: decoded.privileges ?? [],
        };
        next();
    } catch {
        next(new AuthError("Invalid or expired access token"));
    }
};

export const authorize = (...allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        void res;
        const user = req.authenticatedUser;

        if (!user) {
            next(new AuthError("Authentication required"));
            return;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as Role)) {
            next(new ForbiddenError("Insufficient role privileges"));
            return;
        }

        next();
    };
};

export const requirePermission = (...requiredPermissions: Permission[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        void res;
        const user = req.authenticatedUser;

        if (!user) {
            next(new AuthError("Authentication required"));
            return;
        }

        const userRole = user.role as Role;
        const rolePermissions = ROLE_PERMISSIONS[userRole];

        if (!rolePermissions) {
            next(new ForbiddenError("Unknown role"));
            return;
        }

        const hasWildcard = rolePermissions.includes(Permission.WILDCARD);
        if (hasWildcard) {
            next();
            return;
        }

        const hasAll = requiredPermissions.every((perm) => rolePermissions.includes(perm));
        if (!hasAll) {
            next(new ForbiddenError("Insufficient permissions"));
            return;
        }

        next();
    };
};

export const requireAdmin = authorize(Role.ADMIN);
