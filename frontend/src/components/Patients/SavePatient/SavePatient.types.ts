import { DAILY_CASE_TABLE_COL_NUM } from "../CaseDetailsTable/CaseDetailsTable";

export interface NewPatientData {
    patientName: string;
    ownerName: string;
    ownerPhoneNumber: string;
    referringDoctor: string | null;
    comments: string;
    hospitalizationReason: string;
    allergicComments: string | null;
    weightKg: number | undefined;
    caseId: string | undefined;
    ageYears: number | undefined;
    ageMonths: number | undefined;
    catheterDate: string | null;
    procedureDate: string | null;
    bloodTestLink: string | null;
}

export interface ChildCaseData {
    caseId: string;
    patientName: string;
    patientPhotoName: string | null;
}

export const defaultCaseDailyDataTemplate = Array.from(
    { length: DAILY_CASE_TABLE_COL_NUM },
    (_, i) => {
        return {
            id: -1,
            index: i,
            time: "",
            T: null,
            T_is_required: false,
            T_is_editable: true,
            P: null,
            P_is_required: false,
            P_is_editable: true,
            R: null,
            R_is_required: false,
            R_is_editable: true,
            fluids: [],
            medicines: [],
            foodExtras: [],
            examinations: [],
            procedures: [],
            foodAndWater: null,
            foodAndWater_is_required: false,
            foodAndWater_is_editable: true,
            urineTypeId: null,
            urineTypeText: null,
            urineComments: null,
            urine_is_required: false,
            urine_is_editable: true,
            fecesTypeId: null,
            fecesTypeText: null,
            fecesComments: null,
            feces_is_required: false,
            feces_is_editable: true,
            isTravel: null,
            isTravel_is_required: false,
            isTravel_is_editable: true,
            isBoxClean: null,
            isBoxClean_is_required: false,
            isBoxClean_is_editable: true,
            isRelease: null,
            isRelease_is_required: false,
            isRelease_is_editable: true,
            weigh: null,
            weigh_is_required: false,
            weigh_is_editable: true,
            isPuke: null,
            pukeComments: null,
            puke_is_required: false,
            puke_is_editable: true,
            comments: null,
            comments_is_required: false,
            comments_is_editable: true,
            ownerUpdate: null,
            ownerUpdate_is_required: false,
            ownerUpdate_is_editable: true,
        };
    }
);
