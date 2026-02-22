import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@utils/authTokens";
import { AuthError, ForbiddenError } from "@utils/errors";
import type { AuthenticatedUser } from "@petec/shared";
import { ROLE_PERMISSIONS, Permission, Role } from "@petec/shared";

declare global {
    namespace Express {
        interface Request {
            authenticatedUser?: AuthenticatedUser;
            requestId?: string;
        }
    }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AuthError("Missing or invalid authorization header");
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
        throw new AuthError("Invalid or expired access token");
    }
};

export const authorize = (...allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.authenticatedUser;

        if (!user) {
            throw new AuthError("Authentication required");
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as Role)) {
            throw new ForbiddenError("Insufficient role privileges");
        }

        next();
    };
};

export const requirePermission = (...requiredPermissions: Permission[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.authenticatedUser;

        if (!user) {
            throw new AuthError("Authentication required");
        }

        const userRole = user.role as Role;
        const rolePermissions = ROLE_PERMISSIONS[userRole];

        if (!rolePermissions) {
            throw new ForbiddenError("Unknown role");
        }

        const hasWildcard = rolePermissions.includes(Permission.WILDCARD);
        if (hasWildcard) {
            next();
            return;
        }

        const hasAll = requiredPermissions.every((perm) => rolePermissions.includes(perm));
        if (!hasAll) {
            throw new ForbiddenError("Insufficient permissions");
        }

        next();
    };
};

export const requireAdmin = authorize(Role.ADMIN);
