import { z } from "zod";
import { PASSWORD_POLICY, Role, UserStatus } from "../constants";

export const CreateUserFormSchema = z
    .object({
        username: z
            .string()
            .min(3, "שם משתמש חייב להכיל לפחות 3 תווים")
            .max(50)
            .trim(),
        email: z.string().email("כתובת מייל לא תקינה").trim().toLowerCase(),
        password: z
            .string()
            .min(
                PASSWORD_POLICY.MIN_LENGTH,
                `סיסמה חייבת להכיל לפחות ${PASSWORD_POLICY.MIN_LENGTH} תווים`
            )
            .max(PASSWORD_POLICY.MAX_LENGTH)
            .refine((v) => /[A-Z]/.test(v), "נדרשת אות גדולה")
            .refine((v) => /[a-z]/.test(v), "נדרשת אות קטנה")
            .refine((v) => /[0-9]/.test(v), "נדרשת ספרה"),
        confirmPassword: z.string(),
        role: z.nativeEnum(Role),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "הסיסמאות אינן תואמות",
        path: ["confirmPassword"],
    });

export type CreateUserFormValues = z.infer<typeof CreateUserFormSchema>;

export const EditUserFormSchema = z.object({
    email: z.string().email("כתובת מייל לא תקינה").trim().toLowerCase(),
    role: z.nativeEnum(Role),
});

export type EditUserFormValues = z.infer<typeof EditUserFormSchema>;

export const UpdateUserDTOSchema = z.object({
    email: z.string().email().trim().toLowerCase().optional(),
    role: z.nativeEnum(Role).optional(),
    privileges: z.array(z.string()).optional(),
    status: z.nativeEnum(UserStatus).optional(),
});
export type UpdateUserDTO = z.infer<typeof UpdateUserDTOSchema>;

export const UserResponseDTOSchema = z.object({
    id: z.string(),
    email: z.string(),
    role: z.string(),
    privileges: z.array(z.string()),
    status: z.string(),
    lastLogin: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type UserResponseDTO = z.infer<typeof UserResponseDTOSchema>;

export const RegisterResponseDTOSchema = z.object({
    id: z.string(),
    email: z.string(),
    role: z.string(),
});
export type RegisterResponseDTO = z.infer<typeof RegisterResponseDTOSchema>;

export const CreatePatientResponseDTOSchema = z.object({
    patientId: z.string(),
    caseId: z.string(),
    masterCaseId: z.string(),
});
export type CreatePatientResponseDTO = z.infer<typeof CreatePatientResponseDTOSchema>;

export const PatientDocumentResponseDTOSchema = z.object({
    id: z.string(),
    patientId: z.string(),
    caseId: z.string().optional(),
    patientDocumentTypeId: z.string(),
    fileName: z.string(),
    storageKey: z.string().optional(),
    fileUrl: z.string().optional(),
    url: z.string().optional(),
    uploadedByUserId: z.string().optional(),
    uploadedAt: z.string(),
});
export type PatientDocumentResponseDTO = z.infer<typeof PatientDocumentResponseDTOSchema>;
export const PatientDocumentListResponseDTOSchema = z.array(PatientDocumentResponseDTOSchema);
export type PatientDocumentListResponseDTO = z.infer<typeof PatientDocumentListResponseDTOSchema>;

export const PatientMedicineResponseDTOSchema = z.object({
    id: z.string(),
    patientId: z.string(),
    caseId: z.string().optional(),
    medicineId: z.string(),
    dosageFrequencyId: z.string().optional(),
    routeOfAdministrationId: z.string().optional(),
    measureUnitTypeId: z.string().optional(),
    doseAmount: z.union([z.string(), z.number()]).optional(),
    notes: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isActive: z.boolean().optional(),
});
export type PatientMedicineResponseDTO = z.infer<typeof PatientMedicineResponseDTOSchema>;

export const ReleaseMedicinesResponseDTOSchema = z.object({
    releaseMedicines: z.array(PatientMedicineResponseDTOSchema),
});
export type ReleaseMedicinesResponseDTO = z.infer<typeof ReleaseMedicinesResponseDTOSchema>;

export const ChartDataPointSchema = z.object({
    name: z.string(),
    value: z.number(),
});
export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;

export const ChartsDataResponseDTOSchema = z.object({
    caseDetailsGrid: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()]))).optional(),
    temperature: z.array(ChartDataPointSchema),
    pulse: z.array(ChartDataPointSchema),
    respiration: z.array(ChartDataPointSchema),
    weight: z.array(ChartDataPointSchema),
});
export type ChartsDataResponseDTO = z.infer<typeof ChartsDataResponseDTOSchema>;

export const AnesthesiaProcedureFormResponseDTOSchema = z.object({
    name: z.string().optional(),
    ownerName: z.string().optional(),
    plannedProcedure: z.string().optional(),
    priceEstimate: z.number().optional(),
    date: z.string().optional(),
    generalComments: z.string().optional(),
    isCardiovascular: z.boolean().optional(),
    isRespiratory: z.boolean().optional(),
    isNeurological: z.boolean().optional(),
    isEndocrine: z.boolean().optional(),
    isGastrointestinal: z.boolean().optional(),
    isGenitourinary: z.boolean().optional(),
    previousAnestheticProblems: z.boolean().optional(),
    previousAnestheticProblemsComments: z.string().optional(),
    onMedications: z.boolean().optional(),
    onMedicationsComments: z.string().optional(),
    medicalConditionsComments: z.string().optional(),
    physicalExamWNL: z.boolean().optional(),
    physicalExamComments: z.string().optional(),
    heartRate: z.number().optional(),
    respiratoryRate: z.number().optional(),
    temperature: z.number().optional(),
    bloodWorkWNL: z.boolean().optional(),
    bloodWorkComments: z.string().optional(),
    cT: z.boolean().optional(),
    xRay: z.boolean().optional(),
    urinalysis: z.boolean().optional(),
    uS: z.boolean().optional(),
    otherExams: z.string().optional(),
    anesthesiaCategory: z.string().optional(),
    preOpComments: z.string().optional(),
    signature: z.string().optional(),
});
export type AnesthesiaProcedureFormResponseDTO = z.infer<typeof AnesthesiaProcedureFormResponseDTOSchema>;

export const UserRowDTOSchema = z.object({
    id: z.string(),
    username: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    role: z.nativeEnum(Role),
    role_name: z.string(),
    privileges: z.array(z.string()),
    status: z.string(),
    lastLogin: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type UserRowDTO = z.infer<typeof UserRowDTOSchema>;
export const UserRowListResponseDTOSchema = z.array(UserRowDTOSchema);
export type UserRowListResponseDTO = z.infer<typeof UserRowListResponseDTOSchema>;

export const StaffMemberDTOSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    role: z.string(),
});
export type StaffMemberDTO = z.infer<typeof StaffMemberDTOSchema>;
export const StaffMemberListResponseDTOSchema = z.array(StaffMemberDTOSchema);
export type StaffMemberListResponseDTO = z.infer<typeof StaffMemberListResponseDTOSchema>;
