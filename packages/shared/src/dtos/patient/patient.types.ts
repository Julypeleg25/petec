import type { z } from "zod";
import type {
    ArchivePatientDTOSchema,
    CaseDetailsResponseDTOSchema,
    caseDetailsHeaderSchema,
    caseDailyDetailsRowSchema,
    populatedMedicineRefSchema,
    responseExaminationItemSchema,
    responseMedicineItemSchema,
    responseOptionItemSchema,
    DailyPlanDetailDTOSchema,
    DailyPlanDetailListResponseDTOSchema,
    DeleteDocumentDTOSchema,
    DeletePatientCaseDTOSchema,
    EditPatientDTOSchema,
    NewPatientDTOSchema,
    PatientCardRowDTOSchema,
    ReleaseMedicineDisplayDTOSchema,
    ReleasePatientDTOSchema,
    ReleasePatientDataResponseDTOSchema,
    UpdateDailyPlanDTOSchema,
    UpdateDailyPlanRequestDTOSchema,
    UploadDocumentDTOSchema,
    UploadPatientPhotoResponseDTOSchema,
    baseMedicineSchema,
    caseDetailsRowSchema,
} from "./patient.schemas.js";

export type BaseMedicineSchema = z.infer<typeof baseMedicineSchema>;
export type CaseDetailsDataSchema = z.infer<typeof caseDetailsRowSchema>;
export type NewPatientDTO = z.infer<typeof NewPatientDTOSchema>;
export type EditPatientDTO = z.infer<typeof EditPatientDTOSchema>;
export type ReleasePatientDTO = z.infer<typeof ReleasePatientDTOSchema>;
export type UpdateDailyPlanDTO = z.infer<typeof UpdateDailyPlanDTOSchema>;
export type UpdateDailyPlanRequestDTO = z.infer<typeof UpdateDailyPlanRequestDTOSchema>;
export type UploadDocumentDTO = z.infer<typeof UploadDocumentDTOSchema>;
export type UploadPatientPhotoResponseDTO = z.infer<typeof UploadPatientPhotoResponseDTOSchema>;
export type DeleteDocumentDTO = z.infer<typeof DeleteDocumentDTOSchema>;
export type DeletePatientCaseDTO = z.infer<typeof DeletePatientCaseDTOSchema>;
export type ArchivePatientDTO = z.infer<typeof ArchivePatientDTOSchema>;
export type CaseDetailsResponseDTO = z.infer<typeof CaseDetailsResponseDTOSchema>;
export type CaseDetailsHeaderDTO = z.infer<typeof caseDetailsHeaderSchema>;
export type PopulatedMedicineReferenceDTO = z.infer<typeof populatedMedicineRefSchema>;
export type CaseDetailsResponseMedicineItemDTO = z.infer<typeof responseMedicineItemSchema>;
export type CaseDetailsResponseOptionItemDTO = z.infer<typeof responseOptionItemSchema>;
export type CaseDetailsResponseExaminationItemDTO = z.infer<typeof responseExaminationItemSchema>;
export type CaseDetailsResponseRowDTO = z.infer<typeof caseDailyDetailsRowSchema>;
export type CaseDetailsResponseMatrixDTO = NonNullable<CaseDetailsResponseDTO["caseDailyDetails"]>;
export type ReleaseMedicineDisplayDTO = z.infer<typeof ReleaseMedicineDisplayDTOSchema>;
export type ReleasePatientDataResponseDTO = z.infer<typeof ReleasePatientDataResponseDTOSchema>;
export type DailyPlanDetailDTO = z.infer<typeof DailyPlanDetailDTOSchema>;
export type DailyPlanDetailListResponseDTO = z.infer<typeof DailyPlanDetailListResponseDTOSchema>;
export type PatientCardRowDTO = z.infer<typeof PatientCardRowDTOSchema>;
