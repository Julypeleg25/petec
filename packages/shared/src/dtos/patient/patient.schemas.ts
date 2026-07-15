import { z } from "zod";
import { CASE_DATE_FIELDS } from "../../constants/index.js";
import {
    caseSerialIdSchema,
    nullableOptionalDateCoerceSchema,
    objectIdSchema,
} from "../../utils/index.js";

export const baseMedicineSchema = z.object({
    medicineId: objectIdSchema,
    dosageText: z.string().optional(),
    doseAmount: z.union([z.number(), z.string()]).optional(),
    measureUnitTypeId: objectIdSchema.optional(),
    dosageFrequencyId: objectIdSchema.optional(),
    routeOfAdministrationId: objectIdSchema.optional(),
    notes: z.string().optional(),
});

const caseDetailsMedicineBaseSchema = baseMedicineSchema.omit({
    notes: true,
}).extend({
    comment: z.string().optional(),
});

export const caseDetailsMedicineObjSchema = caseDetailsMedicineBaseSchema.extend({
    isGiven: z.boolean().optional(),
    isRequired: z.boolean(),
    isEditable: z.boolean(),
});

export const caseDetailsOptionsObjSchema = z.object({
    typeId: objectIdSchema,
    isGiven: z.boolean().optional(),
    isRequired: z.boolean(),
    isEditable: z.boolean(),
    comment: z.string().optional(),
});

export const caseDetailsExamObjSchema = z.object({
    typeId: objectIdSchema,
    value: z.string().nullable().optional(),
    isRequired: z.boolean(),
    isEditable: z.boolean(),
    comment: z.string().optional(),
});

export const caseDetailsRowSchema = z.object({
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

    isTravel: z.boolean().optional(),
    isTravelIsRequired: z.boolean().optional(),
    isTravelIsEditable: z.boolean().optional(),

    weigh: z.number().optional(),
    weighIsRequired: z.boolean().optional(),
    weighIsEditable: z.boolean().optional(),

    isPuke: z.boolean().optional(),
    pukeComments: z.string().optional(),
    pukeIsRequired: z.boolean().optional(),
    pukeIsEditable: z.boolean().optional(),

    rowComments: z.string().optional(),
    rowCommentsIsRequired: z.boolean().optional(),
    rowCommentsIsEditable: z.boolean().optional(),

    ownerUpdate: z.string().optional(),
    ownerUpdateIsRequired: z.boolean().optional(),
    ownerUpdateIsEditable: z.boolean().optional(),

    foodGiven: z.boolean().optional(),
    waterGiven: z.boolean().optional(),
    foodAndWater: z.string().nullable().optional(),
    foodAndWaterIsRequired: z.boolean().optional(),
    foodAndWaterIsEditable: z.boolean().optional(),

    fluids: z.array(caseDetailsMedicineObjSchema).default([]),
    medicines: z.array(caseDetailsMedicineObjSchema).default([]),
    procedures: z.array(caseDetailsOptionsObjSchema).default([]),
    examinations: z.array(caseDetailsExamObjSchema).default([]),
    foodExtras: z.array(caseDetailsOptionsObjSchema).default([]),
});

export const releaseMedicineSchema = baseMedicineSchema.extend({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

const existingCaseSerialIdSchema = z.string().trim().min(1);

export const NewPatientDTOSchema = z.object({
    caseId: caseSerialIdSchema,
    name: z.string().min(1, "יש להזין שם מטופל").trim(),
    owner: z.object({
        name: z.string().min(1, "יש להזין שם בעלים").trim(),
        phone: z.string().min(1, "יש להזין טלפון בעלים").trim(),
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
        [CASE_DATE_FIELDS.CATHETER_DATE]: nullableOptionalDateCoerceSchema,
        [CASE_DATE_FIELDS.PROCEDURE_DATE]: nullableOptionalDateCoerceSchema,
        [CASE_DATE_FIELDS.NEXT_INSPECTION_DATE]: nullableOptionalDateCoerceSchema,
        [CASE_DATE_FIELDS.STITCHES_REMOVAL_DATE]: nullableOptionalDateCoerceSchema,
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

});

export const EditPatientDTOSchema = z.object({
    patientId: objectIdSchema.optional(),
    caseId: existingCaseSerialIdSchema,

    name: z.string().min(1).trim().optional(),
    owner: z.object({
        name: z.string().min(1).trim(),
        phone: z.string().min(1).trim(),
    }).optional(),

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
        [CASE_DATE_FIELDS.CATHETER_DATE]: nullableOptionalDateCoerceSchema,
        [CASE_DATE_FIELDS.PROCEDURE_DATE]: nullableOptionalDateCoerceSchema,
        [CASE_DATE_FIELDS.NEXT_INSPECTION_DATE]: nullableOptionalDateCoerceSchema,
        [CASE_DATE_FIELDS.STITCHES_REMOVAL_DATE]: nullableOptionalDateCoerceSchema,
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

    caseDetails: z.array(z.array(caseDetailsRowSchema)).optional(),
});

export const ReleasePatientDTOSchema = z.object({
    caseId: existingCaseSerialIdSchema,
    [CASE_DATE_FIELDS.STITCHES_REMOVAL_DATE]: nullableOptionalDateCoerceSchema,
    [CASE_DATE_FIELDS.NEXT_INSPECTION_DATE]: nullableOptionalDateCoerceSchema,
    medicines: z.array(releaseMedicineSchema).default([]),
});

export const ReleasePatientFormDTOSchema = ReleasePatientDTOSchema.pick({
    caseId: true,
}).extend({
    [CASE_DATE_FIELDS.STITCHES_REMOVAL_DATE]: z.string().nullable().optional(),
    [CASE_DATE_FIELDS.NEXT_INSPECTION_DATE]: z.string().nullable().optional(),
});
export type ReleasePatientFormDTO = z.infer<typeof ReleasePatientFormDTOSchema>;

export const UpdateDailyPlanDTOSchema = z.object({
    caseId: existingCaseSerialIdSchema.optional(),
    comment: z.string().optional(),
    comments: z.string().optional(),
});

export const UpdateDailyPlanRequestDTOSchema = z.record(z.string(), UpdateDailyPlanDTOSchema);

export const UploadDocumentDTOSchema = z.object({
    patientId: objectIdSchema,
    caseId: objectIdSchema,
    patientDocumentTypeId: objectIdSchema,
});

export const UploadPatientPhotoResponseDTOSchema = z.object({
    photoName: z.string(),
});

export const UploadDocumentFormDTOSchema = z.object({
    selectedFileName: z.string().trim().min(1, "לא נבחר מסמך להעלאה"),
});
export type UploadDocumentFormDTO = z.infer<typeof UploadDocumentFormDTOSchema>;

export const DeleteDocumentDTOSchema = z.object({
    id: objectIdSchema,
});

export const DeletePatientCaseDTOSchema = z.object({
    caseId: existingCaseSerialIdSchema,
    masterCaseId: objectIdSchema.optional(),
});

export const ArchivePatientDTOSchema = z.object({
    caseId: existingCaseSerialIdSchema,
    shouldArchive: z.boolean(),
});

export const caseDetailsHeaderSchema = z.object({
    name: z.string().default(""),
    owner_name: z.string().default(""),
    owner_phone_number: z.string().default(""),
    referring_doctor: z.string().nullable().optional(),
    comments: z.string().default(""),
    hospitalization_reason: z.string().default(""),
    allergic_comments: z.string().nullable().optional(),
    weight_kg: z.number().nullable().optional(),
    age_years: z.number().nullable().optional(),
    age_months: z.number().nullable().optional(),
    catheter_date_for_input: z.string().nullable().optional(),
    procedure_date_for_input: z.string().nullable().optional(),
    blood_test_link: z.string().nullable().optional(),
    is_archived: z.boolean().default(false),
    gender_type_id: z.string().optional(),
    animal_type_id: z.string().optional(),
    animal_color_id: z.string().optional(),
    insurance_id: z.string().optional(),
    food_type_id: z.string().optional(),
    race_id: z.string().optional(),
    doctor_id: z.string().optional(),
    nurse_id: z.string().optional(),
    is_convenia: z.boolean().default(false),
    is_allergic: z.boolean().default(false),
    is_escape_potential: z.boolean().default(false),
    is_npo: z.boolean().default(false),
    is_risk_anesthesia: z.boolean().default(false),
    is_heart_murmur: z.boolean().default(false),
    is_amb: z.boolean().default(false),
    is_aggressive: z.boolean().default(false),
    is_cerenia: z.boolean().default(false),
    is_procedure: z.boolean().default(false),
    is_released: z.boolean().default(false),
    photo_name: z.string().optional(),
    patient_id: z.string().default(""),
    serial_id: existingCaseSerialIdSchema,
}).strict();

export const populatedMedicineRefSchema = z.object({
    id: z.string(),
    name: z.string(),
}).strict();

export const responseMedicineItemSchema = z.object({
    medicineId: objectIdSchema,
    value: z.string(),
    text: z.string(),
    isGiven: z.boolean(),
    isRequired: z.boolean(),
    isEditable: z.boolean(),
    dosageText: z.string().nullable().optional(),
    doseAmount: z.union([z.number(), z.string()]).nullable().optional(),
    measureUnitType: populatedMedicineRefSchema.nullable().optional(),
    dosageFrequency: populatedMedicineRefSchema.nullable().optional(),
    routeOfAdministration: populatedMedicineRefSchema.nullable().optional(),
    comment: z.string().nullable().optional(),
}).strict();

export const responseOptionItemSchema = z.object({
    value: z.string(),
    text: z.string(),
    isGiven: z.boolean(),
    isRequired: z.boolean(),
    isEditable: z.boolean(),
    comment: z.string().nullable(),
}).strict();

export const responseExaminationItemSchema = z.object({
    value: z.string(),
    text: z.string(),
    exam_value: z.string().nullable(),
    isRequired: z.boolean(),
    isEditable: z.boolean(),
    comment: z.string().nullable(),
}).strict();

export const caseDailyDetailsRowSchema = z.object({
    id: z.string(),
    index: z.number(),
    time: z.string(),
    date: z.string(),

    temperature: z.string().nullable(),
    temperatureIsRequired: z.boolean(),
    temperatureIsEditable: z.boolean(),

    pulse: z.string().nullable(),
    pulseIsRequired: z.boolean(),
    pulseIsEditable: z.boolean(),

    respiration: z.string().nullable(),
    respirationIsRequired: z.boolean(),
    respirationIsEditable: z.boolean(),

    fluids: z.array(responseMedicineItemSchema),
    medicines: z.array(responseMedicineItemSchema),
    procedures: z.array(responseOptionItemSchema),
    foodExtras: z.array(responseOptionItemSchema),
    examinations: z.array(responseExaminationItemSchema),

    foodGiven: z.boolean().optional(),
    waterGiven: z.boolean().optional(),

    foodAndWater: z.string().nullable(),
    foodAndWaterIsRequired: z.boolean(),
    foodAndWaterIsEditable: z.boolean(),

    urineTypeId: z.string().nullable(),
    urineComments: z.string().nullable(),
    urineIsRequired: z.boolean(),
    urineIsEditable: z.boolean(),

    fecesTypeId: z.string().nullable(),
    fecesComments: z.string().nullable(),
    fecesIsRequired: z.boolean(),
    fecesIsEditable: z.boolean(),

    isBoxClean: z.boolean().nullable(),
    isBoxCleanIsRequired: z.boolean(),
    isBoxCleanIsEditable: z.boolean(),

    isRelease: z.boolean().nullable(),
    isReleaseIsRequired: z.boolean(),
    isReleaseIsEditable: z.boolean(),

    isTravel: z.boolean().nullable(),
    isTravelIsRequired: z.boolean(),
    isTravelIsEditable: z.boolean(),

    isPuke: z.boolean().nullable(),
    pukeComments: z.string().nullable(),
    pukeIsRequired: z.boolean(),
    pukeIsEditable: z.boolean(),

    weigh: z.string().nullable(),
    weighIsRequired: z.boolean(),
    weighIsEditable: z.boolean(),

    rowComments: z.string().nullable(),
    rowCommentsIsRequired: z.boolean(),
    rowCommentsIsEditable: z.boolean(),

    ownerUpdate: z.string().nullable(),
    ownerUpdateIsRequired: z.boolean(),
    ownerUpdateIsEditable: z.boolean(),
});

const masterCaseDetailSchema = z.object({
    caseId: z.string(),
    patientName: z.string(),
    patientPhotoName: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
}).strict();

export const CaseDetailsResponseDTOSchema = z.object({
    caseDetails: caseDetailsHeaderSchema,
    caseDailyDetails: z.array(z.array(caseDailyDetailsRowSchema)).nullable(),
    masterCaseDetails: z.array(masterCaseDetailSchema),
}).strict();

export const ReleaseMedicineDisplayDTOSchema = z.object({
    value: z.string(),
    text: z.string(),
    measureUnitTypeId: z.union([z.string(), z.number()]),
    measureUnitText: z.string(),
    dosageFrequencyId: z.union([z.string(), z.number(), z.null()]),
    frequencyText: z.string(),
    doseAmount: z.number(),
    routeOfAdministrationId: z.union([z.string(), z.number(), z.null()]),
    medicineRouteText: z.string(),
    rangeMax: z.number(),
    rangeMin: z.number(),
    totalDose: z.number(),
    comments: z.string(),
});

export const ReleasePatientDataResponseDTOSchema = z.object({
    releaseDate: z.string().nullable(),
    [CASE_DATE_FIELDS.STITCHES_REMOVAL_DATE]: z.string().nullable(),
    [CASE_DATE_FIELDS.NEXT_INSPECTION_DATE]: z.string().nullable(),
    medicines: z.array(ReleaseMedicineDisplayDTOSchema),
});

export const DailyPlanDetailDTOSchema = z.object({
    case_id: z.string(),
    master_case_id: z.string(),
    serial_id: existingCaseSerialIdSchema,
    name: z.string(),
    owner_name: z.string(),
    owner_phone_number: z.string(),
    is_procedure: z.boolean().default(false),
    hospitalization_reason: z.string(),
    daily_plan_comments: z.string().nullable(),
    caseExaminations: z.array(z.object({ name: z.string(), value: z.string(), date: z.string() })),
    caseProcedures: z.array(z.object({ name: z.string(), value: z.boolean(), date: z.string() })),
    ownerUpdate: z.array(z.object({ value: z.string(), date: z.string() })),
    releaseMedicines: z.array(z.object({ value: z.boolean(), date: z.string() })),
});

export const DailyPlanDetailListResponseDTOSchema = z.array(DailyPlanDetailDTOSchema);

export const CalendarPatientBadgeDTOSchema = z.enum([
    "procedure",
    "hospitalization",
]);

export const CalendarPatientFlagsDTOSchema = z.object({
    isAggressive: z.boolean().default(false),
    isEscapePotential: z.boolean().default(false),
    isAllergic: z.boolean().default(false),
    isRiskAnesthesia: z.boolean().default(false),
    isHeartMurmur: z.boolean().default(false),
    isAMB: z.boolean().default(false),
}).strict();

export const CalendarPatientItemDTOSchema = z.object({
    caseId: objectIdSchema,
    masterCaseId: objectIdSchema.nullish(),
    patientId: objectIdSchema,
    serialId: existingCaseSerialIdSchema,
    patientName: z.string(),
    ownerName: z.string(),
    ownerPhoneNumber: z.string(),
    hospitalizationReason: z.string().optional(),
    photoName: z.string().nullable(),
    badges: z.array(CalendarPatientBadgeDTOSchema).min(1),
    flags: CalendarPatientFlagsDTOSchema,
}).strict();

export const CalendarDayDTOSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    patients: z.array(CalendarPatientItemDTOSchema),
}).strict();

export const CalendarMonthResponseDTOSchema = z.object({
    year: z.number().int().min(2000).max(2100),
    month: z.number().int().min(1).max(12),
    days: z.array(CalendarDayDTOSchema),
}).strict();

export const PatientCardRowDTOSchema = z.object({
    _id: z.string().or(objectIdSchema),
    serialId: z.string().trim().min(1),
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
