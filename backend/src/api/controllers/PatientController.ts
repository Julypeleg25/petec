import { Response } from "express";
import PatientService from "../services/PatientService";
import { AuthRequest } from "../middlewares/AuthMiddleware";
import { DeepPartial } from "typeorm";
import { Case } from "../models/Case";
import logger from "../../api/utils/Logger";
import fs from "fs";
import path from "path";

export interface NewPatientDTO {
  name: string;
  ownerName: string;
  ownerPhoneNumber: string;
  insuranceId: number;
  hospitalizationReason: string;
  allergicComments: string | null;
  weightKg: number;
  doctorId: number;
  nurseId: number;
  referringDoctor: string;
  animalId: number;
  genderId: number;
  raceId: number;
  caseId: string;
  isCerenia: boolean;
  isConvenia: boolean;
  isAllergic: boolean;
  isEscapePotential: boolean;
  isNPO: boolean;
  isRiskAnesthesia: boolean;
  isHeartMurmur: boolean;
  isAMB: boolean;
  isAggressive: boolean;
  ageYears: number;
  ageMonths: number;
  animalColorId: number;
  foodTypeId: number;
  catheterDate: string;
  procedureDate: string;
  isProcedure: boolean;
  bloodTestLink: string;
}

export interface EditPatientDTO {
  id: number;
  name: string;
  ownerName: string;
  ownerPhoneNumber: string;
  insuranceId: number;
  hospitalizationReason: string;
  allergicComments: string | null;
  weightKg: number;
  doctorId: number;
  nurseId: number;
  referringDoctor: string;
  animalId: number;
  genderId: number;
  raceId: number;
  caseId: string;
  isCerenia: boolean;
  isConvenia: boolean;
  isAllergic: boolean;
  isEscapePotential: boolean;
  isNPO: boolean;
  isRiskAnesthesia: boolean;
  isHeartMurmur: boolean;
  isAMB: boolean;
  isAggressive: boolean;
  ageYears: number;
  ageMonths: number;
  animalColorId: number;
  foodTypeId: number;
  catheterDate: string;
  procedureDate: string;
  isProcedure: boolean;
  comments: string | null;
  bloodTestLink: string;
  caseDetails?: CaseDetailsData[][];
}

export interface ReleasePatientDTO {
  caseId: string;
  stitchesRemovalDate: string;
  nextInspectionDate: string;
  medicines: Medicine[];
}

export interface PatientReturnDTO {
  name: string;
  ownerName: string;
  ownerPhoneNumber: string;
  animalId: number;
  genderId: number;
  raceId: number;
  case?: DeepPartial<Case>;
}

export interface CaseDetailsData {
  id?: number;
  index: number;
  time: string;
  date: string;
  T: string | null;
  T_is_required: boolean;
  T_is_editable: boolean;
  P: string | null;
  P_is_required: boolean;
  P_is_editable: boolean;
  R: string | null;
  R_is_required: boolean;
  R_is_editable: boolean;
  fluids: CaseDetailsMedicineObj[];
  medicines: CaseDetailsMedicineObj[];
  foodExtras: CaseDetailsOptionsObj[];
  examinations: CaseDetailsOptionsObj[];
  procedures: CaseDetailsOptionsObj[];
  foodAndWater: string | null;
  foodAndWater_is_required: boolean;
  foodAndWater_is_editable: boolean;
  urineTypeId: number | null;
  urineTypeText: string | null;
  urineComments: string | null;
  urine_is_required: boolean;
  urine_is_editable: boolean;
  fecesTypeId: number | null;
  fecesTypeText: string | null;
  fecesComments: string | null;
  feces_is_required: boolean;
  feces_is_editable: boolean;
  isTravel: boolean | null;
  isTravel_is_required: boolean;
  isTravel_is_editable: boolean;
  isBoxClean: boolean | null;
  isBoxClean_is_required: boolean;
  isBoxClean_is_editable: boolean;
  isRelease: boolean | null;
  isRelease_is_required: boolean;
  isRelease_is_editable: boolean;
  weigh: string | null;
  weigh_is_required: boolean;
  weigh_is_editable: boolean;
  isPuke: boolean | null;
  pukeComments: string | null;
  puke_is_required: boolean;
  puke_is_editable: boolean;
  comments: string | null;
  comments_is_required: boolean;
  comments_is_editable: boolean;
  ownerUpdate: string | null;
  ownerUpdate_is_required: boolean;
  ownerUpdate_is_editable: boolean;
}

export interface CaseDetailsMedicineObj {
  value: string;
  text: string;
  measureUnitId: number;
  measureUnitText: string;
  frequencyId: number;
  frequencyText: string;
  doseAmount: number;
  medicineRouteId: number;
  medicineRouteText: string;
}

export interface CaseDetailsOptionsObj {
  value: string;
  text: string;
}

export interface Medicine {
  value: string;
  text: string;
  measureUnitId: number;
  measureUnitText: string;
  frequencyId: number;
  frequencyText: string;
  doseAmount: number;
  medicineRouteId: number;
  medicineRouteText: string;
}

export interface AnesthesiaProcedureFormData {
  name: string;
  ownerName: string;
  plannedProcedure: string;
  priceEstimate: number;
  date: string;
  isFastSinceMidnight: boolean;
  isDistortionHistory: boolean;
  isMedicationsSensitive: boolean;
  isNeedToMarkEar: boolean;
  isSterilization: boolean;
  isPriceIncludesReleaseMedications: boolean;
  caseId: string;
  signature: string;
  generalComments: string;
  distortionComments: string;
  medicationsSensitiveComments: string;
}

class PatientController {
  private PatientService: PatientService = new PatientService();

  public create = async (
    { body, user, file }: AuthRequest,
    res: Response
  ): Promise<void> => {
    logger.debug("logger");
    try {
      const patient = await this.PatientService.create(
        body as NewPatientDTO,
        file!,
        user!
      );
      const patientReturnDTO =
        this.PatientService.convertPatientEntityToPatientReturnDTO(patient);

      res.status(201).json(patientReturnDTO);
    } catch (err: any) {
      logger.error("Failed to create patient: " + err.message);
      res.status(500).json({ error: err.message });
    }
  };

  public edit = async (
    { body, user, file }: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const editedPatientData = body as EditPatientDTO;
      const patient = await this.PatientService.edit(
        editedPatientData,
        file,
        user!
      );
      const patientReturnDTO =
        this.PatientService.convertPatientEntityToPatientReturnDTO(patient);

      res.status(200).json(patientReturnDTO);
    } catch (err: any) {
      logger.error("Failed to edit patient: " + err.message);
      res.status(500).json({ error: err.message });
    }
  };

  public getCaseDetails = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const caseId = req.params.caseId;
    const masterCaseId = req.params.masterCaseId;
    const caseDetails = await this.PatientService.getCaseDetails(
      caseId,
      masterCaseId
    );
    res.status(200).json(caseDetails);
  };

  public getCaseDailyDetails = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const caseId = req.params.id;
    const caseDailyDetails = await this.PatientService.getCaseDailyDetails(
      caseId
    );
    res.status(200).json(caseDailyDetails);
  };

  public anesthesiaProcedureFormNew = async (
    { body, user }: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const anesthesiaProcedureFormData = body as AnesthesiaProcedureFormData;
      await this.PatientService.anesthesiaProcedureFormNew(
        anesthesiaProcedureFormData,
        user!
      );

      res.sendStatus(201);
    } catch (err: any) {
      logger.error(
        "Failed to create anesthesia procedure form: " + err.message
      );
      res.status(500).json({ error: err.message });
    }
  };

  public anesthesiaProcedureFormEdit = async (
    { body, user }: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const anesthesiaProcedureFormData = body as AnesthesiaProcedureFormData;
      await this.PatientService.anesthesiaProcedureFormEdit(
        anesthesiaProcedureFormData,
        user!
      );

      res.sendStatus(200);
    } catch (err: any) {
      logger.error("Failed to edit anesthesia procedure form: " + err.message);
      res.status(500).json({ error: err.message });
    }
  };

  public getAnesthesiaProcedureForm = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const caseId = req.params.id;
    const procedureForm = await this.PatientService.getAnesthesiaProcedureForm(
      caseId
    );
    res.status(200).json(procedureForm);
  };

  public releasePatient = async (
    { body, user }: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const releasePatientData = body as ReleasePatientDTO;
      await this.PatientService.releasePatient(releasePatientData, user!);

      res.status(200).send();
    } catch (err: any) {
      logger.error("Failed to release patient: " + err.message);
      res.status(500).json({ error: err.message });
    }
  };

  public deletePatientCase = async (
    { body, user }: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { patientId } = body;
      await this.PatientService.markPatientCaseDeleted(patientId, user!.userId);
      res.status(200).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public getReleasePatientData = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const caseId = req.params.id;
    const releasePatientData = await this.PatientService.getReleasePatientData(
      caseId
    );
    res.status(200).json(releasePatientData);
  };

  public exportPatientCase = async (
    { body, params }: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const caseId = params.id;
      const caseDailyDetailsDate = body.caseDailyDetailsDate;
      const pdfFilePath = await this.PatientService.exportPatientCase(
        caseId,
        caseDailyDetailsDate
      );

      if (pdfFilePath === "") throw new Error("שגיאת מערכת בייצוא הקובץ");

      const pdfFileName = path.basename(pdfFilePath).split(".")[0];
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${pdfFileName}`
      );
      res.setHeader("X-Filename", pdfFileName);
      res.setHeader("Content-Type", "application/pdf");

      const fileStream = fs.createReadStream(pdfFilePath);
      fileStream.pipe(res);

      fileStream.on("close", () => {
        fs.unlink(pdfFilePath, (err) => {
          if (err) {
            logger.error(`Error deleting the file: ${err}`);
          }
        });
      });
    } catch (err: any) {
      logger.error(`Error sending the file: ${err}`);
      res.status(500).json({ error: err.message });
    }
  };

  public uploadDocuments = async (
    { body, user, file }: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      const { caseId, patientDocumentTypeId } = body;
      await this.PatientService.uploadDocuments(
        caseId,
        patientDocumentTypeId,
        user!,
        file
      );

      res.sendStatus(200);
    } catch (err: any) {
      logger.error("Failed to upload documents: " + err.message);
      res.status(500).json({ error: err.message });
    }
  };

  public getDocuments = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const caseId = req.params.caseId;
    const documents = await this.PatientService.getDocuments(caseId);
    res.status(200).json(documents);
  };

  public deleteDocument = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const { caseId, documentId } = req.body;
    await this.PatientService.deleteDocument(caseId, documentId);
    res.sendStatus(200);
  };

  public getChartsData = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const caseId = req.params.caseId;
    const chartsData = await this.PatientService.getChartsData(caseId);
    res.status(200).json(chartsData);
  };

  public archivePatient = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const { caseId, shouldArchive } = req.body;
    await this.PatientService.archivePatient(caseId, shouldArchive);
    res.sendStatus(200);
  };

  public getDailyPlan = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const dailyPlan = await this.PatientService.getDailyPlan();
    res.status(200).json(dailyPlan);
  };

  public updateDailyPlan = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    const details = req.body;
    await this.PatientService.updateDailyPlan(details);
    res.sendStatus(200);
  };
}

export default PatientController;
