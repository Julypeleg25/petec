import { ROUTES, type SystemTypeName } from "@petec/shared";

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
        userRoles: AUTH + "userRoles",
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
        medicine: makeTypeAliases("medicines"),
        animalColor: makeTypeAliases("animal_colors"),
        animalType: makeTypeAliases("animal_types"),
        animalVitals: {
            ...makeTypeAliases("animal_vitals"),
            allByAnimalId: ADMIN + "types/animal_vitals/animal",
        },
        fecesType: makeTypeAliases("feces_types"),
        urineType: makeTypeAliases("urine_types"),
        foodType: makeTypeAliases("food_types"),
        genderType: makeTypeAliases("gender_types"),
        raceType: {
            ...makeTypeAliases("race_types"),
            allByAnimalId: ADMIN + "types/race_types/animal",
        },
        measureUnitType: makeTypeAliases("measure_unit_types"),
        dosageFrequencyType: makeTypeAliases("dosage_frequencies"),
        insuranceType: makeTypeAliases("insurance_types"),
        foodExtrasType: makeTypeAliases("food_extra_types"),
        proceduresTypes: makeTypeAliases("procedure_types"),
        examinationType: makeTypeAliases("examination_types"),
        routeOfAdministration: makeTypeAliases("routes_of_administration"),
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
        caseDetails: (caseId: string) => PATIENT + "case/details/" + caseId,
        release: PATIENT + "case/release",
        releaseData: (caseId: string) => PATIENT + "case/release/" + caseId,
        releasePatientData: PATIENT + "case/release",
        archiveCase: PATIENT + "case/archive",
        deleteCase: PATIENT + "case/delete",
        delete: PATIENT + "case/delete",
        documents: (patientId: string) => PATIENT + "documents/" + patientId,
        documentsUpload: PATIENT + "documents/upload",
        documentsDelete: (id: string) => PATIENT + "documents/" + id,
        anesthesia: (caseId: string) => PATIENT + "case/anesthesia/" + caseId,
        chartsData: (caseId: string) => PATIENT + "case/charts/" + caseId,
        exportCase: (caseId: string) => PATIENT + "case/export/" + caseId,
        case: {
            anesthesiaProcedureForm: PATIENT + "case/anesthesia",
            anesthesiaProcedureFormNew: PATIENT + "case/anesthesia",
            anesthesiaProcedureFormEdit: PATIENT + "case/anesthesia",
            examinations: ADMIN + "types/examination_types",
            proceduresTypes: ADMIN + "types/procedure_types",
            foodExtrasTypes: ADMIN + "types/food_extra_types",
        },
        dailyPlan: {
            get: PATIENT + "dailyPlan",
            update: PATIENT + "dailyPlan",
        },
    },
    medicine: {
        getAll: MEDICINE + "all",
        getAllByCategoryType: (categoryId: string) => MEDICINE + "getAllByCategoryType/" + categoryId,
        getAllCategoryTypes: MEDICINE + "getAllCategoryTypes",
        frequencies: MEDICINE + "medicinesFrequencies",
        routesOfAdministration: MEDICINE + "medicinesRoutesForAdministration",
        measureUnitTypes: MEDICINE + "measureUnitTypes",
    },
} as const;
