import { logger } from "../../config/logger.js";
import type { Request, Response, NextFunction } from "express";
import { patientService } from "../../services/patient/index.js";
import { patientUploadService } from "../../services/patient/index.js";
import { clinicalSummaryService } from "../../services/clinicalSummary/index.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
} from "../../utils/apiResponse.js";
import {
  getAuthenticatedUserId,
  getValidatedBody,
  getValidatedParams,
} from "../../utils/request.utils.js";
import { HttpStatus } from "@petec/shared";
import type {
  NewPatientDTO,
  EditPatientDTO,
  ReleasePatientDTO,
  ArchivePatientDTO,
  CalendarMonthParamsDTO,
  DeletePatientCaseDTO,
  UploadDocumentDTO,
  UpdateDailyPlanRequestDTO,
  CreateAnesthesiaProcedureFormDTO,
  ClinicalSummaryRequestDTO,
} from "@petec/shared";
import type {
  CaseIdParamsDTO,
  PatientIdParamsDTO,
  DocumentIdParamsDTO,
} from "@petec/shared";
import type { CalendarMonthResponseDTO } from "@petec/shared";
import {
  CreatePatientResponseDTOSchema,
  CalendarMonthResponseDTOSchema,
  CaseDetailsResponseDTOSchema,
  PatientDocumentResponseDTOSchema,
  UploadPatientPhotoResponseDTOSchema,
  PatientDocumentListResponseDTOSchema,
  ReleasePatientDataResponseDTOSchema,
  ChartsDataResponseDTOSchema,
  DailyPlanDetailListResponseDTOSchema,
  CreateAnesthesiaProcedureFormDTOSchema,
  ClinicalSummaryResultDTOSchema,
} from "@petec/shared";

export class PatientController {
  async generateClinicalSummary(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    res.setHeader("Cache-Control", "no-store");
    try {
      const { patientId } = getValidatedParams<PatientIdParamsDTO>(req);
      const { date } = getValidatedBody<ClinicalSummaryRequestDTO>(req);
      const userId = getAuthenticatedUserId(req);
      const result = await clinicalSummaryService.generate({
        patientId,
        userId,
        requestedDate: date,
        requestId: req.requestId,
      });
      sendSuccess(res, result, ClinicalSummaryResultDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async createPatientAndCase(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const dto = getValidatedBody<NewPatientDTO>(req);
      const userId = getAuthenticatedUserId(req);
      const result = await patientService.createPatientAndCase(dto, userId);
      sendCreated(res, result, CreatePatientResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async editPatientAndCase(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const dto = getValidatedBody<EditPatientDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.editPatientAndCase(dto, userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async getCaseDetails(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { caseId, masterCaseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.getCaseDetails(caseId, masterCaseId);
      sendSuccess(res, result, CaseDetailsResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async releasePatient(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const dto = getValidatedBody<ReleasePatientDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.releasePatient(dto, userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async archivePatientCase(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const dto = getValidatedBody<ArchivePatientDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.archivePatientCase(
        dto.caseId,
        dto.shouldArchive,
        userId,
      );
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async deletePatientCase(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const dto = getValidatedBody<DeletePatientCaseDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.deletePatientCase(dto.caseId, userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async getDocuments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.getCaseDocuments(caseId);
      sendSuccess(res, result, PatientDocumentListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async uploadDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const dto = getValidatedBody<UploadDocumentDTO>(req);
      const userId = getAuthenticatedUserId(req);
      const result = await patientUploadService.uploadDocument({
        dto,
        userId,
        file: req.file,
      });
      sendCreated(res, result, PatientDocumentResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async deleteDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { documentId } = getValidatedParams<DocumentIdParamsDTO>(req);
      const userId = getAuthenticatedUserId(req);
      await patientService.deleteDocument(documentId, userId);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async getAnesthesiaForm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.getAnesthesiaForm(caseId);
      sendSuccess(
        res,
        result,
        CreateAnesthesiaProcedureFormDTOSchema.nullable(),
      );
    } catch (err) {
      next(err);
    }
  }

  async upsertAnesthesiaForm(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const data = getValidatedBody<CreateAnesthesiaProcedureFormDTO>(req);
      const userId = getAuthenticatedUserId(req);
      const result = await patientService.upsertAnesthesiaForm(
        caseId,
        data,
        userId,
      );
      sendSuccess(res, result, CreateAnesthesiaProcedureFormDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getReleasePatientData(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.getReleasePatientData(caseId);
      sendSuccess(res, result, ReleasePatientDataResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getChartsData(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { caseId } = getValidatedParams<CaseIdParamsDTO>(req);
      const result = await patientService.getChartsData(caseId);
      sendSuccess(res, result, ChartsDataResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getDailyPlan(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await patientService.getDailyPlan();
      sendSuccess(res, result, DailyPlanDetailListResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getCalendarMonth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { year, month } = getValidatedParams<CalendarMonthParamsDTO>(req);
      const result: CalendarMonthResponseDTO =
        await patientService.getCalendarMonth(year, month);
      sendSuccess(res, result, CalendarMonthResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async updateDailyPlan(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = getValidatedBody<UpdateDailyPlanRequestDTO>(req);
      await patientService.updateDailyPlan(data);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async uploadPatientPhoto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { patientId } = getValidatedParams<PatientIdParamsDTO>(req);
      const userId = getAuthenticatedUserId(req);
      const photoName = await patientUploadService.uploadPatientPhoto({
        patientId,
        userId,
        file: req.file,
      });
      sendSuccess(res, { photoName }, UploadPatientPhotoResponseDTOSchema);
    } catch (err) {
      next(err);
    }
  }

  async getPatientPhoto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { patientId } = getValidatedParams<PatientIdParamsDTO>(req);
      const result = await patientService.getPatientPhotoStream(patientId);
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Cache-Control", "public, max-age=300");
      res.status(HttpStatus.OK);
      result.stream.once("error", (streamError) => {
        next(streamError);
      });
      result.stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
