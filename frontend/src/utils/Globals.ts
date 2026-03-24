export const BASE_URL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:9000/";

const AUTH_CONTROLLER = "auth/";
const TABLE_CONTROLLER = "table/";
const ADMIN_CONTROLLER = "admin/";
const USER_CONTROLLER = "user/";
const PATIENT_CONTROLLER = "patient/";
const MEDICINE_CONTROLLER = "medicine/";

export const globals = {
  auth: {
    auth: BASE_URL + AUTH_CONTROLLER,
    register: BASE_URL + AUTH_CONTROLLER + "register",
    login: BASE_URL + AUTH_CONTROLLER + "login",
    refreshToken: BASE_URL + AUTH_CONTROLLER + "refreshToken",
    logout: BASE_URL + AUTH_CONTROLLER + "logout",
    userRoles: BASE_URL + AUTH_CONTROLLER + "userRoles",
    forgotPassword: BASE_URL + AUTH_CONTROLLER + "forgotPassword",
    resetPassword: BASE_URL + AUTH_CONTROLLER + "resetPassword",
  },
  tableGenerator: {
    getTableData: BASE_URL + TABLE_CONTROLLER + "getTableData",
  },
  admin: {
    medicine: {
      new: BASE_URL + ADMIN_CONTROLLER + "medicine/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "medicine/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "medicine/delete",
    },
    animalColor: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "animalColor/all",
      new: BASE_URL + ADMIN_CONTROLLER + "animalColor/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "animalColor/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "animalColor/delete",
    },
    animalType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "animalType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "animalType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "animalType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "animalType/delete",
    },
    fecesType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "fecesType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "fecesType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "fecesType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "fecesType/delete",
    },
    urineType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "urineType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "urineType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "urineType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "urineType/delete",
    },
    foodType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "foodType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "foodType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "foodType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "foodType/delete",
    },
    genderType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "genderType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "genderType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "genderType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "genderType/delete",
    },
    measureUnitType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "measureUnitType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "measureUnitType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "measureUnitType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "measureUnitType/delete",
    },
    dosageFrequencyType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "dosageFrequencyType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "dosageFrequencyType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "dosageFrequencyType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "dosageFrequencyType/delete",
    },
    insuranceType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "insuranceType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "insuranceType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "insuranceType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "insuranceType/delete",
    },
    foodExtrasType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "foodExtrasType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "foodExtrasType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "foodExtrasType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "foodExtrasType/delete",
    },
    proceduresTypes: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "proceduresTypes/all",
      new: BASE_URL + ADMIN_CONTROLLER + "proceduresTypes/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "proceduresTypes/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "proceduresTypes/delete",
    },
    examinationType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "examinationType/all",
      new: BASE_URL + ADMIN_CONTROLLER + "examinationType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "examinationType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "examinationType/delete",
    },
    raceType: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "raceType/all",
      getAllByAnimalId: BASE_URL + ADMIN_CONTROLLER + "raceType/allByAnimalId",
      new: BASE_URL + ADMIN_CONTROLLER + "raceType/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "raceType/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "raceType/delete",
    },
    routeOfAdministration: {
      getAll: BASE_URL + ADMIN_CONTROLLER + "routeOfAdministration/all",
      new: BASE_URL + ADMIN_CONTROLLER + "routeOfAdministration/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "routeOfAdministration/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "routeOfAdministration/delete",
    },
    animalVitals: {
      getAllByAnimalId:
        BASE_URL + ADMIN_CONTROLLER + "animalVitals/allByAnimalId",
      new: BASE_URL + ADMIN_CONTROLLER + "animalVitals/new",
      edit: BASE_URL + ADMIN_CONTROLLER + "animalVitals/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "animalVitals/delete",
    },
    user: {
      edit: BASE_URL + ADMIN_CONTROLLER + "user/edit",
      delete: BASE_URL + ADMIN_CONTROLLER + "user/delete",
    },
    downloadBulkTemplate: BASE_URL + ADMIN_CONTROLLER + "downloadBulkTemplate",
    uploadBulkTemplate: BASE_URL + ADMIN_CONTROLLER + "uploadBulkTemplate",
  },
  user: {
    doctors: BASE_URL + USER_CONTROLLER + "doctors",
    nurses: BASE_URL + USER_CONTROLLER + "nurses",
  },
  patient: {
    new: BASE_URL + PATIENT_CONTROLLER + "new",
    edit: BASE_URL + PATIENT_CONTROLLER + "edit",
    case: {
      details: BASE_URL + PATIENT_CONTROLLER + "case/details",
      caseDailyDetails: BASE_URL + PATIENT_CONTROLLER + "case/caseDailyDetails",
      anesthesiaProcedureForm:
        BASE_URL + PATIENT_CONTROLLER + "case/anesthesiaProcedureForm",
      anesthesiaProcedureFormEdit:
        BASE_URL + PATIENT_CONTROLLER + "case/anesthesiaProcedureForm/edit",
      anesthesiaProcedureFormNew:
        BASE_URL + PATIENT_CONTROLLER + "case/anesthesiaProcedureForm/new",
      foodExtrasTypes: BASE_URL + PATIENT_CONTROLLER + "case/foodExtrasTypes",
      examinations: BASE_URL + PATIENT_CONTROLLER + "case/examinations",
      proceduresTypes: BASE_URL + PATIENT_CONTROLLER + "case/proceduresTypes",
    },
    release: BASE_URL + PATIENT_CONTROLLER + "release",
    delete: BASE_URL + PATIENT_CONTROLLER + "delete",
    releasePatientData: BASE_URL + PATIENT_CONTROLLER + "releasePatientData",
    exportPatientCase: BASE_URL + PATIENT_CONTROLLER + "exportPatientCase",
    documents: BASE_URL + PATIENT_CONTROLLER + "documents",
    chartsData: BASE_URL + PATIENT_CONTROLLER + "chartsData",
    archivePatient: BASE_URL + PATIENT_CONTROLLER + "archivePatient",
    dailyPlan: {
      getDailyPlan: BASE_URL + PATIENT_CONTROLLER + "dailyPlan",
      updateDailyPlan: BASE_URL + PATIENT_CONTROLLER + "dailyPlan/edit",
    },
  },
  medicine: {
    getAll: BASE_URL + MEDICINE_CONTROLLER + "all",
    getAllByCategoryType:
      BASE_URL + MEDICINE_CONTROLLER + "getAllByCategoryType",
    getAllCategoryTypes: BASE_URL + MEDICINE_CONTROLLER + "getAllCategoryTypes",
    medicinesFrequencies:
      BASE_URL + MEDICINE_CONTROLLER + "medicinesFrequencies",
    medicinesRoutesForAdministration:
      BASE_URL + MEDICINE_CONTROLLER + "medicinesRoutesForAdministration",
    measureUnitTypes: BASE_URL + MEDICINE_CONTROLLER + "measureUnitTypes",
  },
};
