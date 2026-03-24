import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { validate } from ".";

export const validateCreateSystemEntityType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      name: Joi.string().max(100).required(),
    })
  );
};

export const validateEditSystemEntityType = (
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
      name: Joi.string().max(100).required(),
    })
  );
};

export const validateCreateAnimalVitals = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      animalId: Joi.number().required(),
      rangeMax: Joi.number().min(0).allow(null),
      rangeMin: Joi.number().min(0).allow(null),
      type: Joi.string().valid("T", "P", "R").required(),
    })
  );
};

export const validateEditAnimalVitals = (
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
      animalId: Joi.number().required(),
      rangeMax: Joi.number().min(0).allow(null),
      rangeMin: Joi.number().min(0).allow(null),
      type: Joi.string().valid("T", "P", "R").required(),
    })
  );
};

export const validateCreateRaceType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      name: Joi.string().max(100).required(),
      animalTypeId: Joi.number().required(),
    })
  );
};

export const validateEditRaceType = (
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
      name: Joi.string().max(100).required(),
      animalTypeId: Joi.number().required(),
    })
  );
};

export const validateCreateDosageFrequencyType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      name: Joi.string().max(100).required(),
      description: Joi.string().max(100).required(),
      descriptionPerHour: Joi.string().max(100).required(),
    })
  );
};

export const validateEditDosageFrequencyType = (
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
      name: Joi.string().max(100).required(),
      description: Joi.string().max(100).required(),
      descriptionPerHour: Joi.string().max(100).required(),
    })
  );
};

export const validateEditMedicine = (
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
      name: Joi.string().max(100).required(),
      rangeMax: Joi.number().min(0).allow(null),
      rangeMin: Joi.number().min(0).allow(null),
      totalDose: Joi.number().min(0).allow(null),
      routeOfAdministrationId: Joi.number().allow(null),
      dosageFrequencyId: Joi.number().allow(null),
      unit: Joi.number().required(),
      categoryId: Joi.number().required(),
      comments: Joi.string().max(300).allow(null).allow(""),
    })
  );
};

export const validateCreateMedicine = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      name: Joi.string().max(100).required(),
      rangeMax: Joi.number().min(0).allow(null),
      rangeMin: Joi.number().min(0).allow(null),
      totalDose: Joi.number().min(0).allow(null),
      routeOfAdministrationId: Joi.number().allow(null),
      dosageFrequencyId: Joi.number().allow(null),
      unit: Joi.number().required(),
      categoryId: Joi.number().required(),
      comments: Joi.string().max(300).allow(null).allow(""),
    })
  );
};

export const validateIdExist = (
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
    })
  );
};
