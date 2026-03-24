import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { validate } from ".";
import { Case } from "../../models/Case";
import { AnimalType } from "../../models/AnimalType";
import { GenderType } from "../../models/GenderType";
import { RaceType } from "../../models/RaceType";
import { AnimalColor } from "../../models/AnimalColor";
import { FoodType } from "../../models/FoodType";
import { checkDoesIdExist } from "../../utils";

export const validateCreatePatient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.body.catheterDate =
    req.body.catheterDate === "" ? null : req.body.catheterDate;
  req.body.procedureDate =
    req.body.procedureDate === "" ? null : req.body.procedureDate;
  req.body.ageYears = req.body.ageYears === "" ? null : req.body.ageYears;
  req.body.ageMonths = req.body.ageMonths === "" ? null : req.body.ageMonths;

  validate(
    req,
    res,
    next,
    Joi.object({
      name: Joi.string().max(100).required(),
      ownerName: Joi.string().max(100).required(),
      ownerPhoneNumber: Joi.string()
        .pattern(/^\d{10}$/)
        .required(),
      insuranceId: Joi.number().required(),
      hospitalizationReason: Joi.string().max(250).required(),
      allergicComments: Joi.string().max(300).allow(null).allow(""),
      doctorId: Joi.number().required(),
      nurseId: Joi.number().required(),
      referringDoctor: Joi.string().allow(null).allow(""),
      weightKg: Joi.number().required(),
      animalId: Joi.number().required(),
      genderId: Joi.number().required(),
      raceId: Joi.number().allow(null),
      caseId: Joi.string().required(),
      isAllergic: Joi.boolean().required(),
      isEscapePotential: Joi.boolean().required(),
      isNPO: Joi.boolean().required(),
      isRiskAnesthesia: Joi.boolean().required(),
      isHeartMurmur: Joi.boolean().required(),
      isAMB: Joi.boolean().required(),
      isAggressive: Joi.boolean().required(),
      isCerenia: Joi.boolean().required(),
      isConvenia: Joi.boolean().required(),
      ageYears: Joi.number().integer().allow(null),
      ageMonths: Joi.number().integer().allow(null),
      animalColorId: Joi.number().required(),
      foodTypeId: Joi.number().required(),
      catheterDate: Joi.date().allow(null),
      procedureDate: Joi.date().allow(null),
      isProcedure: Joi.boolean().required(),
      bloodTestLink: Joi.string().allow(null).allow(""),
    })
  );
};

export const validateEditPatient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.body.caseDetails = JSON.parse(
    req.body.caseDetails === undefined ? "[]" : req.body.caseDetails
  );
  req.body.catheterDate =
    req.body.catheterDate === "" ? null : req.body.catheterDate;
  req.body.procedureDate =
    req.body.procedureDate === "" ? null : req.body.procedureDate;
  req.body.ageYears = req.body.ageYears === "" ? null : req.body.ageYears;
  req.body.ageMonths = req.body.ageMonths === "" ? null : req.body.ageMonths;

  validate(
    req,
    res,
    next,
    Joi.object({
      id: Joi.number().required(),
      name: Joi.string().max(100).required(),
      ownerName: Joi.string().max(100).required(),
      ownerPhoneNumber: Joi.string()
        .pattern(/^\d{10}$/)
        .required(),
      insuranceId: Joi.number().required(),
      comments: Joi.string().max(2000).allow(null).allow(""),
      hospitalizationReason: Joi.string().max(250).required(),
      allergicComments: Joi.string().max(300).allow(null).allow(""),
      doctorId: Joi.number().required(),
      nurseId: Joi.number().required(),
      referringDoctor: Joi.string().allow(null).allow(""),
      weightKg: Joi.number().required(),
      animalId: Joi.number().required(),
      genderId: Joi.number().required(),
      raceId: Joi.number().allow(null),
      caseId: Joi.string().required(),
      isAllergic: Joi.boolean().required(),
      isEscapePotential: Joi.boolean().required(),
      isNPO: Joi.boolean().required(),
      isRiskAnesthesia: Joi.boolean().required(),
      isHeartMurmur: Joi.boolean().required(),
      isAMB: Joi.boolean().required(),
      isAggressive: Joi.boolean().required(),
      isCerenia: Joi.boolean().required(),
      isConvenia: Joi.boolean().required(),
      ageYears: Joi.number().integer().allow(null),
      ageMonths: Joi.number().integer().allow(null),
      animalColorId: Joi.number().required(),
      foodTypeId: Joi.number().required(),
      catheterDate: Joi.date().allow(null),
      procedureDate: Joi.date().allow(null),
      isProcedure: Joi.boolean().required(),
      bloodTestLink: Joi.string().allow(null).allow(""),
      caseDetails: Joi.array().items(
        Joi.array().items(
          Joi.object({
            id: Joi.number().allow(null),
            index: Joi.number().allow(null),
            time: Joi.string().allow(null).allow(""),
            date: Joi.string().allow(null).allow(""),
            T: Joi.number().allow(null).allow(""),
            T_is_required: Joi.boolean().allow(null),
            T_is_editable: Joi.boolean().allow(null),
            P: Joi.number().allow(null).allow(""),
            P_is_required: Joi.boolean().allow(null),
            P_is_editable: Joi.boolean().allow(null),
            R: Joi.number().allow(null).allow(""),
            R_is_required: Joi.boolean().allow(null),
            R_is_editable: Joi.boolean().allow(null),
            fluids: Joi.allow(null),
            medicines: Joi.allow(null),
            foodExtras: Joi.allow(null),
            examinations: Joi.allow(null),
            procedures: Joi.allow(null),
            foodAndWater: Joi.string().allow(null),
            foodAndWater_is_required: Joi.boolean().allow(null),
            foodAndWater_is_editable: Joi.boolean().allow(null),
            urineTypeId: Joi.number().allow(null),
            urineTypeText: Joi.string().allow(null),
            urineComments: Joi.string().allow(null),
            urine_is_required: Joi.boolean().allow(null),
            urine_is_editable: Joi.boolean().allow(null),
            fecesTypeId: Joi.number().allow(null),
            fecesTypeText: Joi.string().allow(null),
            fecesComments: Joi.string().allow(null),
            feces_is_required: Joi.boolean().allow(null),
            feces_is_editable: Joi.boolean().allow(null),
            isTravel: Joi.boolean().allow(null),
            isTravel_is_required: Joi.boolean().allow(null),
            isTravel_is_editable: Joi.boolean().allow(null),
            isBoxClean: Joi.boolean().allow(null),
            isBoxClean_is_required: Joi.boolean().allow(null),
            isBoxClean_is_editable: Joi.boolean().allow(null),
            isRelease: Joi.boolean().allow(null),
            isRelease_is_required: Joi.boolean().allow(null),
            isRelease_is_editable: Joi.boolean().allow(null),
            weigh: Joi.number().allow(null).allow(""),
            weigh_is_required: Joi.boolean().allow(null),
            weigh_is_editable: Joi.boolean().allow(null),
            isPuke: Joi.boolean().allow(null),
            pukeComments: Joi.string().allow(null),
            puke_is_required: Joi.boolean().allow(null),
            puke_is_editable: Joi.boolean().allow(null),
            comments: Joi.string().allow(null),
            comments_is_required: Joi.boolean().allow(null),
            comments_is_editable: Joi.boolean().allow(null),
            ownerUpdate: Joi.string().allow(null),
            ownerUpdate_is_required: Joi.boolean().allow(null),
            ownerUpdate_is_editable: Joi.boolean().allow(null),
          })
        )
      ),
    })
  );
};

export const validateDeletePatient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      patientId: Joi.number().required(),
    })
  );
};

export const validateDeleteDocument = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      caseId: Joi.string().required(),
      documentId: Joi.number().required(),
    })
  );
};

export const validateUploadDocument = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      caseId: Joi.string().required(),
      patientDocumentTypeId: Joi.number().required(),
    })
  );
};

export const validateArchivePatient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      caseId: Joi.string().required(),
      shouldArchive: Joi.boolean().required(),
    })
  );
};

export const validateReleasePatient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object({
      caseId: Joi.string().required(),
      stitchesRemovalDate: Joi.date().allow(null),
      nextInspectionDate: Joi.date().allow(null),
      medicines: Joi.array().items(
        Joi.object({
          value: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
          text: Joi.string().required(),
          measureUnitId: Joi.number().required(),
          measureUnitText: Joi.string().required(),
          frequencyId: Joi.number().required(),
          frequencyText: Joi.string().required(),
          doseAmount: Joi.number().required(),
          medicineRouteId: Joi.number().required(),
          medicineRouteText: Joi.string().required(),
          rangeMax: Joi.number().min(0).allow(null),
          rangeMin: Joi.number().min(0).allow(null),
          totalDose: Joi.number().min(0).allow(null),
          comments: Joi.string().max(300).allow(null),
          defaultMedicineRouteId: Joi.number().allow(null),
          defaultFrequencyId: Joi.number().allow(null),
        })
      ),
    })
  );
};

export const validateCreateAnesthesiaProcedureForm = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.body.date = req.body.date === "" ? null : req.body.date;

  validate(
    req,
    res,
    next,
    Joi.object({
      name: Joi.string().max(100).required(),
      ownerName: Joi.string().max(100).required(),
      plannedProcedure: Joi.string().allow(null).allow(""),
      priceEstimate: Joi.number(),
      date: Joi.string().allow(null),
      isFastSinceMidnight: Joi.boolean().allow(null),
      isDistortionHistory: Joi.boolean().allow(null),
      isMedicationsSensitive: Joi.boolean().allow(null),
      isNeedToMarkEar: Joi.boolean().allow(null),
      isSterilization: Joi.boolean().allow(null),
      isPriceIncludesReleaseMedications: Joi.boolean(),
      caseId: Joi.string().required(),
      signature: Joi.string().required(),
      generalComments: Joi.string().allow(null),
      distortionComments: Joi.string().allow(null),
      medicationsSensitiveComments: Joi.string().allow(null),
    })
  );
};

export const validateEditAnesthesiaProcedureForm = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.body.date = req.body.date === "" ? null : req.body.date;

  validate(
    req,
    res,
    next,
    Joi.object({
      name: Joi.string().max(100).required(),
      ownerName: Joi.string().max(100).required(),
      plannedProcedure: Joi.string().allow(null).allow(""),
      priceEstimate: Joi.number(),
      date: Joi.string().allow(null),
      isFastSinceMidnight: Joi.boolean().allow(null),
      isDistortionHistory: Joi.boolean().allow(null),
      isMedicationsSensitive: Joi.boolean().allow(null),
      isNeedToMarkEar: Joi.boolean().allow(null),
      isSterilization: Joi.boolean().allow(null),
      isPriceIncludesReleaseMedications: Joi.boolean(),
      caseId: Joi.string().required(),
      signature: Joi.string().required(),
      generalComments: Joi.string().allow(null),
      distortionComments: Joi.string().allow(null),
      medicationsSensitiveComments: Joi.string().allow(null),
    })
  );
};

export const validateUpdateDailyPlan = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validate(
    req,
    res,
    next,
    Joi.object().pattern(
      Joi.string(),
      Joi.object({
        comment: Joi.string().allow(null),
      })
    )
  );
};

export const ensureCaseIdNotTaken = async (
  { body: { caseId } }: Request,
  res: Response,
  next: NextFunction
) =>
  (await checkDoesIdExist(caseId, Case))
    ? res.status(409).json({ error: "מספר התיק כבר תפוס" })
    : next();

export const ensureAnimalDetailsExist = async (
  { body: { animalId, genderId, raceId, animalColorId, foodTypeId } }: Request,
  res: Response,
  next: NextFunction
) => {
  const requiredChecks = [
    { id: animalId, type: AnimalType },
    { id: genderId, type: GenderType },
    { id: animalColorId, type: AnimalColor },
    { id: foodTypeId, type: FoodType },
  ];

  const checks = [{ id: raceId, type: RaceType }];

  const requiredResults = await Promise.all(
    requiredChecks.map(async ({ id, type }) => await checkDoesIdExist(id, type))
  );

  const results = await Promise.all(
    checks.map(async ({ id, type }) => {
      if (id) return await checkDoesIdExist(id, type);
      else return true;
    })
  );

  [...results, ...requiredResults].every((result) => result)
    ? next()
    : res.status(404).json({ error: "פרטים על החיה לא נמצאו" });
};
