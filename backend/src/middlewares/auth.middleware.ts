import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@utils/authTokens";
import { AuthError, ForbiddenError } from "@constants/error.constants";
import { logger } from "@config/logger";
import type { AuthenticatedUser } from "@petec/shared";
import { ROLE_PERMISSIONS, Permission, Role, roles } from "@petec/shared";

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

        if (req.ctx) {
            req.ctx.user = {
                userId: decoded.userId,
                role: decoded.role,
                permissions: decoded.privileges ?? [],
            };
        }

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
            const route = `${req.method} ${req.originalUrl.split("?")[0] || req.originalUrl}`;
            logger.warn("Insufficient role privileges", {
                module: "auth",
                request_id: req.requestId,
                user_id: user.userId,
                route,
                required_roles: allowedRoles.join(","),
                user_role: user.role,
            });
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
            const route = `${req.method} ${req.originalUrl.split("?")[0] || req.originalUrl}`;
            logger.warn("Unknown role encountered", {
                module: "auth",
                request_id: req.requestId,
                user_id: user.userId,
                route,
                user_role: user.role,
            });
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
            const route = `${req.method} ${req.originalUrl.split("?")[0] || req.originalUrl}`;
            logger.warn("Insufficient permissions", {
                module: "auth",
                request_id: req.requestId,
                user_id: user.userId,
                route,
                required_permissions: requiredPermissions.join(","),
            });
            next(new ForbiddenError("Insufficient permissions"));
            return;
        }

        next();
    };
};

export const requireAdmin = authorize(roles.ADMIN);
