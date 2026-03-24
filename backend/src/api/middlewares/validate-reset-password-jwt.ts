import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { promisify } from "util";
import { AppDataSource } from "../../config/typeORM";
import { User } from "../models/User";
import createHttpError from "http-errors";

const { JWT_SECRET } = process.env;
const promiseVerify: (
  token: string,
  secret: Secret
) => Promise<JwtPayload | string> = promisify(jwt.verify);

export default async (req: Request, res: Response, next: NextFunction) => {
  const { email, userName } = (await promiseVerify(
    req.body.token,
    JWT_SECRET!!
  )) as { email: string; userName: string };

  const userDb = await AppDataSource.getRepository(User).findOne({
    where: { email, username: userName, isDeleted: false },
  });
  if (userDb == null)
    return next(
      createHttpError(404, "לא נמצא משתמש עם המייל ושם המשתמש שניתנו")
    );

  req.body = { ...req.body, userName, email };
  next();
};
