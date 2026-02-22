import { Request, Response, NextFunction } from "express";
import { patientService } from "@services/patient.service";
import { sendSuccess, sendCreated, sendNoContent } from "@utils/apiResponse";
import { getParam } from "@utils/request.utils";
import type {
    NewPatientDTO,
    EditPatientDTO,
    ReleasePatientDTO,
    ArchivePatientDTO,
    DeletePatientCaseDTO,
    UploadDocumentDTO,
    CreateAnesthesiaProcedureFormDTO,
} from "@petec/shared";

export class PatientController {
    async createPatientAndCase(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto = req.body as NewPatientDTO;
            const userId = (req as Request & { user: { userId: string } }).user.userId;
            const result = await patientService.createPatientAndCase(dto, userId);
            sendCreated(res, result);
        } catch (err) {
            next(err);
        }
    };

    async editPatientAndCase(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto = req.body as EditPatientDTO;
            const userId = (req as Request & { user: { userId: string } }).user.userId;
            await patientService.editPatientAndCase(dto, userId);
            sendNoContent(res);
        } catch (err) {
            next(err);
        }
    };

    async getCaseDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const caseId = getParam(req, "caseId");
            const result = await patientService.getCaseDetails(caseId);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async releasePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto = req.body as ReleasePatientDTO;
            const userId = (req as Request & { user: { userId: string } }).user.userId;
            await patientService.releasePatient(dto, userId);
            sendNoContent(res);
        } catch (err) {
            next(err);
        }
    };

    async archivePatientCase(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto = req.body as ArchivePatientDTO;
            const userId = (req as Request & { user: { userId: string } }).user.userId;
            await patientService.archivePatientCase(dto.caseId, userId);
            sendNoContent(res);
        } catch (err) {
            next(err);
        }
    };

    async deletePatientCase(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto = req.body as DeletePatientCaseDTO;
            const userId = (req as Request & { user: { userId: string } }).user.userId;
            await patientService.deletePatientCase(dto.caseId, userId);
            sendNoContent(res);
        } catch (err) {
            next(err);
        }
    };

    async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const patientId = getParam(req, "patientId");
            const result = await patientService.getPatientDocuments(patientId);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const dto = req.body as UploadDocumentDTO;
            const userId = (req as Request & { user: { userId: string } }).user.userId;
            const storageKey = `documents/${Date.now()}`;
            const fileName = (req.file?.originalname) ?? "document";
            const result = await patientService.uploadDocumentMetadata(dto, storageKey, fileName, userId);
            sendCreated(res, result);
        } catch (err) {
            next(err);
        }
    };

    async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const documentId = getParam(req, "documentId");
            const userId = (req as Request & { user: { userId: string } }).user.userId;
            await patientService.deleteDocument(documentId, userId);
            sendNoContent(res);
        } catch (err) {
            next(err);
        }
    };

    async getAnesthesiaForm(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const caseId = getParam(req, "caseId");
            const result = await patientService.getAnesthesiaForm(caseId);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async upsertAnesthesiaForm(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const caseId = getParam(req, "caseId");
            const data = req.body as CreateAnesthesiaProcedureFormDTO;
            const userId = (req as Request & { user: { userId: string } }).user.userId;
            const result = await patientService.upsertAnesthesiaForm(caseId, data, userId);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async getReleasePatientData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const caseId = getParam(req, "caseId");
            const result = await patientService.getReleasePatientData(caseId);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async getChartsData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const caseId = getParam(req, "caseId");
            const result = await patientService.getChartsData(caseId);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };

    async exportCase(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const caseId = getParam(req, "caseId");
            const result = await patientService.exportPatientCase(caseId);
            sendSuccess(res, result);
        } catch (err) {
            next(err);
        }
    };
}

export const patientController = new PatientController();
