import type { Request, Response, NextFunction } from "express";
import { bulkTemplateService } from "@services/bulkTemplate.service";
import { sendSuccess } from "@utils/apiResponse";
import { getValidatedBody, getValidatedParams } from "@utils/request.utils";
import { BadRequestError } from "@constants/error.constants";
import type {
    BulkTemplateDownloadDTO,
    BulkTemplateUploadParamsDTO,
} from "@petec/shared";
import { BulkTemplateUploadResponseDTOSchema } from "@petec/shared";
import { http } from "winston";
import { HttpStatus } from "@petec/shared";

export class BulkTemplateController {
    async downloadTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { systemType } = getValidatedBody<BulkTemplateDownloadDTO>(req);
            const typeName = systemType;
            const csvBuffer = await bulkTemplateService.downloadTemplate(typeName);
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="${typeName}_template.csv"`);
            res.setHeader("Content-Length", csvBuffer.length);
            res.status(HttpStatus.OK).end(csvBuffer);
        } catch (err) {
            next(err);
        }
    }

    async uploadTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { systemType } = getValidatedParams<BulkTemplateUploadParamsDTO>(req);
            const typeName = systemType;
            const file = req.file;
            if (!file) {
                throw new BadRequestError("CSV file is required");
            }
            const created = await bulkTemplateService.uploadTemplate(typeName, file.buffer);
            sendSuccess(res, { created }, BulkTemplateUploadResponseDTOSchema);
        } catch (err) {
            next(err);
        }
    }
}

export const bulkTemplateController = new BulkTemplateController();
