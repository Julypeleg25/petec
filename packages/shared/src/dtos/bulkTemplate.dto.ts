import { z } from "zod";
import { SYSTEM_TYPE_NAMES_VALUES } from "../constants/index.js";

export const BulkTemplateDownloadDTOSchema = z.object({
    systemType: z.enum(SYSTEM_TYPE_NAMES_VALUES),
}).strict();
export type BulkTemplateDownloadDTO = z.infer<typeof BulkTemplateDownloadDTOSchema>;

export const BulkTemplateUploadParamsDTOSchema = z.object({
    systemType: z.enum(SYSTEM_TYPE_NAMES_VALUES),
}).strict();
export type BulkTemplateUploadParamsDTO = z.infer<typeof BulkTemplateUploadParamsDTOSchema>;

export const BulkTemplateUploadResponseDTOSchema = z.object({
    created: z.number().int().nonnegative(),
}).strict();
export type BulkTemplateUploadResponseDTO = z.infer<typeof BulkTemplateUploadResponseDTOSchema>;
