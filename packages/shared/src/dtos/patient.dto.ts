import { z } from "zod";
import { objectIdSchema } from "../utils/index";

const caseDetailsMedicineObjSchema = z.object({
    medicineId: objectIdSchema,
    name: z.string().optional(),
    dosageText: z.string().optional(),
    doseAmount: z.number().optional(),
    measureUnitTypeId: objectIdSchema.optional(),
    isGiven: z.boolean().optional(),
    isRequired: z.boolean(),
    isEditable: z.boolean(),
    comment: z.string().optional(),
});

const caseDetailsOptionsObjSchema = z.object({
    typeId: objectIdSchema,
    name: z.string().optional(),
    isGiven: z.boolean().optional(),
    isRequired: z.boolean(),
    isEditable: z.boolean(),
    comment: z.string().optional(),
});

const caseDetailsRowSchema = z.object({
    date: z.string(),
    time: z.string(),
    index: z.number().int(),

    temperature: z.number().optional(),
    temperatureIsRequired: z.boolean().optional(),
    temperatureIsEditable: z.boolean().optional(),

    pulse: z.number().optional(),
    pulseIsRequired: z.boolean().optional(),
    pulseIsEditable: z.boolean().optional(),

    respiration: z.number().optional(),
    respirationIsRequired: z.boolean().optional(),
    respirationIsEditable: z.boolean().optional(),

    urineTypeId: objectIdSchema.optional(),
    urineComments: z.string().optional(),
    urineIsRequired: z.boolean().optional(),
    urineIsEditable: z.boolean().optional(),

    fecesTypeId: objectIdSchema.optional(),
    fecesComments: z.string().optional(),
    fecesIsRequired: z.boolean().optional(),
    fecesIsEditable: z.boolean().optional(),

    isBoxClean: z.boolean().optional(),
    isBoxCleanIsRequired: z.boolean().optional(),
    isBoxCleanIsEditable: z.boolean().optional(),

    isRelease: z.boolean().optional(),
    isReleaseIsRequired: z.boolean().optional(),
    isReleaseIsEditable: z.boolean().optional(),

    foodGiven: z.boolean().optional(),
    waterGiven: z.boolean().optional(),

    fluids: z.array(caseDetailsMedicineObjSchema).default([]),
    medicines: z.array(caseDetailsMedicineObjSchema).default([]),
    procedures: z.array(caseDetailsOptionsObjSchema).default([]),
    examinations: z.array(caseDetailsOptionsObjSchema).default([]),
    foodExtras: z.array(caseDetailsOptionsObjSchema).default([]),
});

export type CaseDetailsDataSchema = z.infer<typeof caseDetailsRowSchema>;

const releaseMedicineSchema = z.object({
    medicineId: objectIdSchema,
    dosageFrequencyId: objectIdSchema.optional(),
    routeOfAdministrationId: objectIdSchema.optional(),
    measureUnitTypeId: objectIdSchema.optional(),
    doseAmount: z.union([z.number(), z.string()]).optional(),
    notes: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

const plannedMedicineSchema = z.object({
    medicineId: objectIdSchema,
    dosageText: z.string().optional(),
    doseAmount: z.number().optional(),
    measureUnitTypeId: objectIdSchema.optional(),
    dosageFrequencyId: objectIdSchema.optional(),
    routeOfAdministrationId: objectIdSchema.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isActive: z.boolean().default(true),
    notes: z.string().optional(),
});

const plannedProcedureSchema = z.object({
    procedureTypeId: objectIdSchema,
    plannedProcedureText: z.string().optional(),
    scheduledFor: z.string().optional(),
    priority: z.string().optional(),
    status: z.string().default("pending"),
    notes: z.string().optional(),
});

const plannedFoodExtraSchema = z.object({
    foodExtraTypeId: objectIdSchema,
    amount: z.number().optional(),
    measureUnitTypeId: objectIdSchema.optional(),
    frequencyId: objectIdSchema.optional(),
    notes: z.string().optional(),
});

const plannedExaminationSchema = z.object({
    examinationTypeId: objectIdSchema,
    scheduledFor: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
});

export const NewPatientDTOSchema = z.object({
    name: z.string().min(1, "Patient name is required").trim(),
    owner: z.object({
        name: z.string().min(1, "Owner name is required").trim(),
        phone: z.string().min(1, "Owner phone is required").trim(),
    }),

    admission: z.object({
        hospitalizationReason: z.string().optional(),
        referringDoctor: z.string().optional(),
        allergicComments: z.string().nullable().optional(),
        bloodTestLink: z.string().nullable().optional(),
    }).optional(),

    patientSnapshot: z.object({
        ageYears: z.number().int().min(0).optional(),
        ageMonths: z.number().int().min(0).max(11).optional(),
        weightKg: z.number().min(0).optional(),
    }).optional(),

    flags: z.object({
        isAllergic: z.boolean().optional(),
        isEscapePotential: z.boolean().optional(),
        isNPO: z.boolean().optional(),
        isRiskAnesthesia: z.boolean().optional(),
        isHeartMurmur: z.boolean().optional(),
        isAMB: z.boolean().optional(),
        isAggressive: z.boolean().optional(),
        isConvenia: z.boolean().optional(),
        isCerenia: z.boolean().optional(),
        isProcedure: z.boolean().optional(),
    }).optional(),

    dates: z.object({
        catheterDate: z.coerce.date().optional(),
        procedureDate: z.coerce.date().optional(),
        nextInspectionDate: z.coerce.date().optional(),
        stitchesRemovalDate: z.coerce.date().optional(),
    }).optional(),

    refs: z.object({
        animalTypeId: objectIdSchema.optional(),
        genderTypeId: objectIdSchema.optional(),
        raceTypeId: objectIdSchema.optional(),
        animalColorId: objectIdSchema.optional(),
        insuranceTypeId: objectIdSchema.optional(),
        foodTypeId: objectIdSchema.optional(),
    }).optional(),

    doctorUserId: objectIdSchema.optional(),
    nurseUserId: objectIdSchema.optional(),

    comments: z.string().optional(),
    dailyPlan: z.object({
        comments: z.string().optional(),
    }).optional(),

    planned: z.object({
        medicines: z.array(plannedMedicineSchema).default([]),
        procedures: z.array(plannedProcedureSchema).default([]),
        foodExtras: z.array(plannedFoodExtraSchema).default([]),
        examinations: z.array(plannedExaminationSchema).default([]),
    }).optional(),
});
export type NewPatientDTO = z.infer<typeof NewPatientDTOSchema>;

export const EditPatientDTOSchema = z.object({
    patientId: objectIdSchema,
    caseId: objectIdSchema,

    name: z.string().min(1).trim().optional(),
    owner: z.object({
        name: z.string().min(1).trim(),
        phone: z.string().min(1).trim(),
    }).optional(),
    photoName: z.string().optional(),

    admission: z.object({
        hospitalizationReason: z.string().optional(),
        referringDoctor: z.string().optional(),
        allergicComments: z.string().nullable().optional(),
        bloodTestLink: z.string().nullable().optional(),
    }).optional(),

    patientSnapshot: z.object({
        ageYears: z.number().int().min(0).optional(),
        ageMonths: z.number().int().min(0).max(11).optional(),
        weightKg: z.number().min(0).optional(),
    }).optional(),

    flags: z.object({
        isAllergic: z.boolean().optional(),
        isEscapePotential: z.boolean().optional(),
        isNPO: z.boolean().optional(),
        isRiskAnesthesia: z.boolean().optional(),
        isHeartMurmur: z.boolean().optional(),
        isAMB: z.boolean().optional(),
        isAggressive: z.boolean().optional(),
        isConvenia: z.boolean().optional(),
        isCerenia: z.boolean().optional(),
        isProcedure: z.boolean().optional(),
    }).optional(),

    dates: z.object({
        catheterDate: z.coerce.date().optional(),
        procedureDate: z.coerce.date().optional(),
        nextInspectionDate: z.coerce.date().optional(),
        stitchesRemovalDate: z.coerce.date().optional(),
    }).optional(),

    refs: z.object({
        animalTypeId: objectIdSchema.optional(),
        genderTypeId: objectIdSchema.optional(),
        raceTypeId: objectIdSchema.optional(),
        animalColorId: objectIdSchema.optional(),
        insuranceTypeId: objectIdSchema.optional(),
        foodTypeId: objectIdSchema.optional(),
    }).optional(),

    doctorUserId: objectIdSchema.optional(),
    nurseUserId: objectIdSchema.optional(),

    comments: z.string().optional(),
    dailyPlan: z.object({
        comments: z.string().optional(),
    }).optional(),

    planned: z.object({
        medicines: z.array(plannedMedicineSchema).default([]),
        procedures: z.array(plannedProcedureSchema).default([]),
        foodExtras: z.array(plannedFoodExtraSchema).default([]),
        examinations: z.array(plannedExaminationSchema).default([]),
    }).optional(),

    caseDetails: z.array(z.array(caseDetailsRowSchema)).optional(),
});
export type EditPatientDTO = z.infer<typeof EditPatientDTOSchema>;

export const ReleasePatientDTOSchema = z.object({
    caseId: objectIdSchema,
    stitchesRemovalDate: z.coerce.date().optional(),
    nextInspectionDate: z.coerce.date().optional(),
    medicines: z.array(releaseMedicineSchema).default([]),
});
export type ReleasePatientDTO = z.infer<typeof ReleasePatientDTOSchema>;

export const UpdateDailyPlanDTOSchema = z.object({
    caseId: objectIdSchema,
    comments: z.string().optional(),
});
export type UpdateDailyPlanDTO = z.infer<typeof UpdateDailyPlanDTOSchema>;

export const UpdateDailyPlanRequestDTOSchema = z.record(z.string(), UpdateDailyPlanDTOSchema);
export type UpdateDailyPlanRequestDTO = z.infer<typeof UpdateDailyPlanRequestDTOSchema>;

export const UploadDocumentDTOSchema = z.object({
    patientId: objectIdSchema,
    caseId: objectIdSchema.optional(),
    patientDocumentTypeId: objectIdSchema,
});
export type UploadDocumentDTO = z.infer<typeof UploadDocumentDTOSchema>;

export const DeleteDocumentDTOSchema = z.object({
    id: objectIdSchema,
});
export type DeleteDocumentDTO = z.infer<typeof DeleteDocumentDTOSchema>;

export const DeletePatientCaseDTOSchema = z.object({
    caseId: objectIdSchema,
    masterCaseId: objectIdSchema.optional(),
});
export type DeletePatientCaseDTO = z.infer<typeof DeletePatientCaseDTOSchema>;

export const ArchivePatientDTOSchema = z.object({
    caseId: objectIdSchema,
});
export type ArchivePatientDTO = z.infer<typeof ArchivePatientDTOSchema>;

export const CaseDetailsResponseDTOSchema = z.object({
    caseDetails: z.array(z.array(caseDetailsRowSchema)),
    patientInfo: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
});
export type CaseDetailsResponseDTO = z.infer<typeof CaseDetailsResponseDTOSchema>;

export const ReleaseMedicineDisplayDTOSchema = z.object({
    value: z.string(),
    text: z.string(),
    measureUnitId: z.union([z.string(), z.number()]),
    measureUnitText: z.string(),
    frequencyId: z.union([z.string(), z.number()]),
    frequencyText: z.string(),
    doseAmount: z.number(),
    medicineRouteId: z.union([z.string(), z.number()]),
    medicineRouteText: z.string(),
    rangeMax: z.number(),
    rangeMin: z.number(),
    totalDose: z.number(),
    comments: z.string(),
    defaultMedicineRouteId: z.union([z.string(), z.number(), z.null()]),
    defaultFrequencyId: z.union([z.string(), z.number(), z.null()]),
});
export type ReleaseMedicineDisplayDTO = z.infer<typeof ReleaseMedicineDisplayDTOSchema>;

export const ReleasePatientDataResponseDTOSchema = z.object({
    releaseDate: z.string().nullable(),
    stitchesRemovalDate: z.string().nullable(),
    nextInspectionDate: z.string().nullable(),
    medicines: z.array(ReleaseMedicineDisplayDTOSchema),
});
export type ReleasePatientDataResponseDTO = z.infer<typeof ReleasePatientDataResponseDTOSchema>;

export const DailyPlanDetailDTOSchema = z.object({
    case_id: z.string(),
    master_case_id: z.string(),
    name: z.string(),
    owner_name: z.string(),
    owner_phone_number: z.string(),
    hospitalization_reason: z.string(),
    daily_plan_comments: z.string(),
    caseExaminations: z.array(z.object({ name: z.string(), value: z.string(), date: z.string() })),
    caseProcedures: z.array(z.object({ name: z.string(), value: z.boolean(), date: z.string() })),
    ownerUpdate: z.array(z.object({ value: z.string(), date: z.string() })),
    releaseMedicines: z.array(z.object({ value: z.boolean(), date: z.string() })),
});
export type DailyPlanDetailDTO = z.infer<typeof DailyPlanDetailDTOSchema>;
export const DailyPlanDetailListResponseDTOSchema = z.array(DailyPlanDetailDTOSchema);
export type DailyPlanDetailListResponseDTO = z.infer<typeof DailyPlanDetailListResponseDTOSchema>;

export const PatientCardRowDTOSchema = z.object({
    _id: z.string().or(objectIdSchema),
    masterCaseId: z.string().or(objectIdSchema).optional(),
    patientId: z.object({
        name: z.string(),
        owner: z.object({
            name: z.string(),
            phone: z.string(),
        }),
        photoName: z.string().optional(),
    }),
    admission: z.object({
        hospitalizationReason: z.string().optional(),
    }).optional(),
    flags: z.object({
        isAggressive: z.boolean().optional(),
        isEscapePotential: z.boolean().optional(),
        isAllergic: z.boolean().optional(),
        isRiskAnesthesia: z.boolean().optional(),
        isHeartMurmur: z.boolean().optional(),
        isAMB: z.boolean().optional(),
    }).optional(),
    numOfAlerts: z.number().optional().default(0),
});
export type PatientCardRowDTO = z.infer<typeof PatientCardRowDTOSchema>;

export {
    caseDetailsRowSchema,
    caseDetailsMedicineObjSchema,
    caseDetailsOptionsObjSchema,
    releaseMedicineSchema,
    plannedMedicineSchema,
    plannedProcedureSchema,
    plannedFoodExtraSchema,
    plannedExaminationSchema,
};
