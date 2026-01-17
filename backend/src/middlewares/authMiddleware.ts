import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ENV } from "@config/config";
import { AuthenticatedUser } from "@models/User";

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: AuthenticatedUser;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization token missing or invalid" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      ENV.jwtAccessSecret
    ) as JwtPayload & AuthenticatedUser;

    if (!decoded.userId) {
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }

    req.authenticatedUser = {
      userId: decoded.userId,
      userRole: decoded.userRole,
      userFullName: decoded.userFullName,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
