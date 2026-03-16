import {
    ROUTES,
    SYSTEM_TYPE_NAMES,
    type MedicineCategoryType,
    type SystemTypeName,
} from "@petec/shared";

const AUTH = ROUTES.AUTH + "/";
const TABLE = ROUTES.TABLE + "/";
const ADMIN = ROUTES.ADMIN + "/";
const USERS = ROUTES.USERS + "/";
const PATIENT = ROUTES.PATIENT + "/";
const MEDICINE = ROUTES.MEDICINE + "/";

const typeRoute = (typeName: SystemTypeName) => ADMIN + "types/" + typeName;

const makeTypeAliases = (typeName: SystemTypeName) => ({
    base: typeRoute(typeName),
    all: typeRoute(typeName) + "/all",
    byId: (id: string) => typeRoute(typeName) + "/" + id,
    allByAnimalId: typeRoute(typeName) + "/animal",
});

export const API_ROUTES = {
    auth: {
        register: AUTH + "register",
        login: AUTH + "login",
        refresh: AUTH + "refresh",
        logout: AUTH + "logout",
        forgotPassword: AUTH + "forgot-password",
        resetPassword: AUTH + "reset-password",
    },
    table: {
        getData: TABLE,
    },
    tableGenerator: {
        getTableData: TABLE,
    },
    admin: {
        users: ADMIN + "users",
        user: {
            edit: (id: string) => ADMIN + "users/" + id,
            delete: (id: string) => ADMIN + "users/" + id,
            create: AUTH + "register",
        },
        types: {
            getActive: (typeName: SystemTypeName) => typeRoute(typeName),
            getAll: (typeName: SystemTypeName) => typeRoute(typeName) + "/all",
            create: (typeName: SystemTypeName) => typeRoute(typeName),
            edit: (typeName: SystemTypeName, id: string) => typeRoute(typeName) + "/" + id,
            delete: (typeName: SystemTypeName, id: string) => typeRoute(typeName) + "/" + id,
            byAnimalType: (typeName: SystemTypeName, animalTypeId: string) =>
                typeRoute(typeName) + "/animal/" + animalTypeId,
        },
        medicine: makeTypeAliases(SYSTEM_TYPE_NAMES.MEDICINES),
        animalColor: makeTypeAliases(SYSTEM_TYPE_NAMES.ANIMAL_COLORS),
        animalType: makeTypeAliases(SYSTEM_TYPE_NAMES.ANIMAL_TYPES),
        animalVitals: {
            ...makeTypeAliases(SYSTEM_TYPE_NAMES.ANIMAL_VITALS),
            allByAnimalId: ADMIN + "types/" + SYSTEM_TYPE_NAMES.ANIMAL_VITALS + "/animal",
        },
        fecesType: makeTypeAliases(SYSTEM_TYPE_NAMES.FECES_TYPES),
        urineType: makeTypeAliases(SYSTEM_TYPE_NAMES.URINE_TYPES),
        foodType: makeTypeAliases(SYSTEM_TYPE_NAMES.FOOD_TYPES),
        genderType: makeTypeAliases(SYSTEM_TYPE_NAMES.GENDER_TYPES),
        raceType: {
            ...makeTypeAliases(SYSTEM_TYPE_NAMES.RACE_TYPES),
            allByAnimalId: ADMIN + "types/" + SYSTEM_TYPE_NAMES.RACE_TYPES + "/animal",
        },
        measureUnitType: makeTypeAliases(SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES),
        dosageFrequencyType: makeTypeAliases(SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES),
        insuranceType: makeTypeAliases(SYSTEM_TYPE_NAMES.INSURANCE_TYPES),
        foodExtrasType: makeTypeAliases(SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES),
        proceduresTypes: makeTypeAliases(SYSTEM_TYPE_NAMES.PROCEDURE_TYPES),
        examinationType: makeTypeAliases(SYSTEM_TYPE_NAMES.EXAMINATION_TYPES),
        routeOfAdministration: makeTypeAliases(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION),
        anesthesiaFormTexts: makeTypeAliases(SYSTEM_TYPE_NAMES.ANESTHESIA_FORM_TEXTS),
        downloadBulkTemplate: ADMIN + "types/bulk/download",
        uploadBulkTemplate: ADMIN + "types/bulk/upload",
    },
    user: {
        doctors: USERS + "doctors",
        nurses: USERS + "nurses",
    },
    patient: {
        create: PATIENT + "new",
        edit: PATIENT + "edit",
        caseDetails: (caseId: string) =>
            PATIENT + "case/caseDailyDetails/" + caseId,
        caseDetailsWithMaster: (masterCaseId: string, caseId: string) =>
            PATIENT + "case/caseDailyDetails/" + masterCaseId + "/" + caseId,
        release: PATIENT + "case/release",
        releaseData: (caseId: string) =>
            PATIENT + "case/release/" + caseId,
        archiveCase: PATIENT + "case/archive",
        deleteCase: PATIENT + "case/delete",
        delete: PATIENT + "case/delete",
        documentsByCase: (caseId: string) => PATIENT + "documents/case/" + caseId,
        documentsUpload: PATIENT + "documents/upload",
        documentsDelete: (id: string) => PATIENT + "documents/" + id,
        photo: (patientId: string) => PATIENT + "photo/" + patientId,
        anesthesia: (caseId: string) =>
            PATIENT + "case/anesthesia/" + caseId,
        chartsData: (caseId: string) =>
            PATIENT + "case/charts/" + caseId,
        exportCase: (caseId: string) =>
            PATIENT + "case/export/" + caseId,
        case: {
            anesthesiaProcedureForm: PATIENT + "case/anesthesia",
            anesthesiaProcedureFormNew: PATIENT + "case/anesthesia",
            anesthesiaProcedureFormEdit: PATIENT + "case/anesthesia",
            examinations: ADMIN + "types/" + SYSTEM_TYPE_NAMES.EXAMINATION_TYPES,
            proceduresTypes: ADMIN + "types/" + SYSTEM_TYPE_NAMES.PROCEDURE_TYPES,
            foodExtrasTypes: ADMIN + "types/" + SYSTEM_TYPE_NAMES.FOOD_EXTRA_TYPES,
        },
        dailyPlan: {
            get: PATIENT + "dailyPlan",
            update: PATIENT + "dailyPlan",
        },
    },
    medicine: {
        getAll: MEDICINE + "all",
        getAllByCategoryType: (categoryType: MedicineCategoryType) =>
            MEDICINE + "getAllByCategoryType/" + categoryType,
        getAllCategoryTypes: MEDICINE + "getAllCategoryTypes",
        frequencies: MEDICINE + "medicinesFrequencies",
        routesOfAdministration: MEDICINE + "medicinesRoutesForAdministration",
        measureUnitTypes: MEDICINE + "measureUnitTypes",
    },
} as const;
