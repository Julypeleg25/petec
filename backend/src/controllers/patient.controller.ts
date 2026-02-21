import type { Request, Response, NextFunction } from "express";
import { patientService } from "@services/patient.service";
import { sendSuccess, sendCreated, sendNoContent } from "@utils/apiResponse";
import { getAuthenticatedUserId, getValidatedBody, getValidatedParams } from "@utils/request.utils";
import { HttpStatus } from "@petec/shared";
import type {
  NewPatientDTO,
  EditPatientDTO,
  ReleasePatientDTO,
  ArchivePatientDTO,
  DeletePatientCaseDTO,
  UploadDocumentDTO,
  UpdateDailyPlanRequestDTO,
  CreateAnesthesiaProcedureFormDTO,
} from "@petec/shared";
import type { CaseIdParamsDTO, PatientIdParamsDTO, DocumentIdParamsDTO } from "@petec/shared";
import {
  CreatePatientResponseDTOSchema,
  CaseDetailsResponseDTOSchema,
  PatientDocumentResponseDTOSchema,
  PatientDocumentListResponseDTOSchema,
  ReleasePatientDataResponseDTOSchema,
  ChartsDataResponseDTOSchema,
  DailyPlanDetailListResponseDTOSchema,
  CreateAnesthesiaProcedureFormDTOSchema,
} from "@petec/shared";

export class PatientController {
  async createPatientAndCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = getValidatedBody<NewPatientDTO>(req);
      const userId = getAuthenticatedUserId(req);
      const result = await patientService.createPatientAndCase(dto, userId);
      sendCreated(res, result, CreatePatientResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async editPatientAndCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = getValidatedBody<EditPatientDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.editPatientAndCase(dto, userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async getCaseDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.getCaseDetails(caseId);
      sendSuccess(res, result, CaseDetailsResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async releasePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = getValidatedBody<ReleasePatientDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.releasePatient(dto, userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async archivePatientCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = getValidatedBody<ArchivePatientDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.archivePatientCase(dto.caseId, userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async deletePatientCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = getValidatedBody<DeletePatientCaseDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.deletePatientCase(dto.caseId, userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId } = getValidatedParams<PatientIdParamsDTO>(req);
      const result = await patientService.getPatientDocuments(patientId);
      sendSuccess(res, result, PatientDocumentListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = getValidatedBody<UploadDocumentDTO>(req);
      const userId = getAuthenticatedUserId(req);
      const storageKey = `documents/${Date.now()}`;
      const fileName = (req.file?.originalname) ?? "document";
      const result = await patientService.uploadDocumentMetadata(dto, storageKey, fileName, userId);
      sendCreated(res, result, PatientDocumentResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { documentId } = getValidatedParams<DocumentIdParamsDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.deleteDocument(documentId, userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async getAnesthesiaForm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.getAnesthesiaForm(caseId);
      sendSuccess(res, result, CreateAnesthesiaProcedureFormDTOSchema.nullable());
    } catch (err) {
      next(err);
    }
  }

  async upsertAnesthesiaForm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const data = getValidatedBody<CreateAnesthesiaProcedureFormDTO>(req);
      const userId = getAuthenticatedUserId(req);
      const result = await patientService.upsertAnesthesiaForm(caseId, data, userId);
      sendSuccess(res, result, CreateAnesthesiaProcedureFormDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getReleasePatientData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.getReleasePatientData(caseId);
      sendSuccess(res, result, ReleasePatientDataResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getChartsData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.getChartsData(caseId);
      sendSuccess(res, result, ChartsDataResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getDailyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      void req;
      const result = await patientService.getDailyPlan();
      sendSuccess(res, result, DailyPlanDetailListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async updateDailyPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = getValidatedBody<UpdateDailyPlanRequestDTO>(req);
      await patientService.updateDailyPlan(data);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async exportCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.exportPatientCase(caseId);
      res.setHeader("Content-Disposition", `attachment; filename="case-${caseId}.pdf"`);
      res.setHeader("Content-Type", "application/pdf");
      res.status(HttpStatus.OK).send(result);
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
