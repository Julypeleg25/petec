export { UserModel } from "./User";
export type { IUser, IRefreshToken, UserDocument } from "./User.types";

export { PatientModel } from "./Patient";
export type { IPatient, IPatientOwner, PatientDocument } from "./Patient.types";

export { CaseModel } from "./Case";
export type {
    ICase,
    ICaseDetailsRow,
    ICaseDetailsMedicineObj,
    ICaseDetailsOptionsObj,
    IPlannedMedicine,
    IPlannedProcedure,
    IPlannedFoodExtra,
    IPlannedExamination,
    CaseDocument,
} from "./Case";

export { MasterCaseModel } from "./MasterCase";
export type { IMasterCase, MasterCaseDocument } from "./MasterCase.types";

export { AnesthesiaFormModel } from "./AnesthesiaForm";
export type { IAnesthesiaForm, AnesthesiaFormDocument } from "./AnesthesiaForm.types";

export { PatientDocumentModel } from "./PatientDocument";
export type { IPatientDocument, PatientDocumentDocument } from "./PatientDocument.types";

export { PatientMedicineModel } from "./PatientMedicine";
export type { IPatientMedicine, PatientMedicineDocument } from "./PatientMedicine.types";

export { AuditLogModel } from "./AuditLog";
export type { IAuditLog, AuditLogDocument } from "./AuditLog.types";

export {
    AnimalTypeModel,
    RaceTypeModel,
    AnimalColorModel,
    AnimalVitalsModel,
    GenderTypeModel,
    InsuranceTypeModel,
    FoodTypeModel,
    FoodExtraTypeModel,
    ExaminationTypeModel,
    FecesTypeModel,
    UrineTypeModel,
    DosageFrequencyModel,
    MeasureUnitTypeModel,
    ProcedureTypeModel,
    MedicineModel,
    MedicineCategoryModel,
    RouteOfAdministrationModel,
    PatientDocumentTypeModel,
    SYSTEM_TYPE_MODEL_MAP,
} from "./Lookups";
export type {
    IBaseLookup,
    ILookupWithAnimalType,
    IMedicine,
    IMedicineCategory,
    BaseLookupDocument,
    LookupWithAnimalTypeDocument,
    MedicineDocument,
    MedicineCategoryDocument,
} from "./Lookups.types";
