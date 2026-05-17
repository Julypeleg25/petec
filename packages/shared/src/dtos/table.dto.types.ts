import type { z } from "zod";
import type {
    GetTableDataDTOSchema,
    TableDataResponseDTOSchema,
    PatientCardTableDataResponseDTOSchema,
} from "./table.dto.js";

export type GetTableDataDTO = z.infer<typeof GetTableDataDTOSchema>;
export type TableDataResponseDTO = z.infer<typeof TableDataResponseDTOSchema>;
export type PatientCardTableDataResponseDTO = z.infer<typeof PatientCardTableDataResponseDTOSchema>;
