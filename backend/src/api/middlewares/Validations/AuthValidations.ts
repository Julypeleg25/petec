import { validate } from ".";
import Joi from "joi";
import { Request, Response, NextFunction } from "express";

const USERNAME_REGEX = /^[A-Za-z\u0590-\u05FF0-9\s]{6,}$/;
const PASSWORD_REGEX =
  /^(?=.*[A-Za-z\u0590-\u05FF])(?=.*[0-9])[A-Za-z\u0590-\u05FF0-9]{6,}$/;
const USERNAME_MESSAGE =
  "שם המשתמש חייב להיות באורך של 6 תווים לפחות ולהכיל רק אותיות בעברית/אנגלית, מספרים ורווחים";
const PASSWORD_MESSAGE =
  "הסיסמא חייבת להיות באורך 6 תווים לפחות, להכיל רק אותיות באנגלית/עברית ומספרים, חייבת להכיל לפחות אות אחת וספרה אחת";

export const validateRefreshTokenExist = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      refreshToken: Joi.string().required(),
    })
  );
};

export const validateUserRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      username: Joi.string()
        .max(30)
        .required()
        .pattern(USERNAME_REGEX)
        .message(USERNAME_MESSAGE),
      password: Joi.string()
        .max(20)
        .required()
        .pattern(PASSWORD_REGEX)
        .message(PASSWORD_MESSAGE),
      email: Joi.string().max(150).required().email(),
      firstName: Joi.string().max(30).required(),
      lastName: Joi.string().max(30).required(),
      roleId: Joi.number().required(),
    })
  );
};

export const validateUserLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      username: Joi.string().max(30).required(),
      password: Joi.string().max(20).required(),
    })
  );
};

export const validateEditUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      id: Joi.number().required(),
      username: Joi.string()
        .max(30)
        .required()
        .pattern(USERNAME_REGEX)
        .message(USERNAME_MESSAGE),
      email: Joi.string().max(150).required().email(),
      firstName: Joi.string().max(30).required(),
      lastName: Joi.string().max(30).required(),
      roleId: Joi.number().required(),
    })
  );
};

export const validateForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      email: Joi.string().required().email(),
    })
  );
};

export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      newPassword: Joi.string()
        .max(20)
        .required()
        .pattern(PASSWORD_REGEX)
        .message(PASSWORD_MESSAGE),
      confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
      token: Joi.string().required(),
    })
  );
};
