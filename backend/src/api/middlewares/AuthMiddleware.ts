import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../../api/utils/Logger";

export interface TokenUser {
  userId: string;
  userRole: string;
  userFullName: string;
}
export interface AuthRequest extends Request {
  user?: TokenUser;
  file?: any;
}

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET!!, (err, user) => {
    if (err) {
      logger.error(`${err}`);
      return res.sendStatus(401);
    }

    req.user = user as TokenUser;
    next();
  });
};

export default authMiddleware;
