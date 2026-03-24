import "dotenv/config";
import { DataSource } from "typeorm";
import { User } from "../api/models/User";
import { AnimalType } from "../api/models/AnimalType";
import { GenderType } from "../api/models/GenderType";
import { AnimalColor } from "../api/models/AnimalColor";
import { UrineType } from "../api/models/UrineType";
import { FoodType } from "../api/models/FoodType";
import { FecesType } from "../api/models/FecesType";
import { RaceType } from "../api/models/RaceType";
import { UserRole } from "../api/models/UserRole";
import { UserPrivilege } from "../api/models/UserPrivilege";
import { Case } from "../api/models/Case";
import { Patient } from "../api/models/Patient";
import { CaseDailyDetails } from "../api/models/CaseDailyDetails";
import { Medicine } from "../api/models/Medicine";
import { MedicineCategory } from "../api/models/MedicineCategory";
import { RouteOfAdministration } from "../api/models/RouteOfAdministration";
import { DosageFrequency } from "../api/models/DosageFrequency";
import { CaseDailyDetailsMedicines } from "../api/models/CaseDailyDetailsMedicines";
import { PatientMedicine } from "../api/models/PatientMedicine";
import { CaseMedicines } from "../api/models/CaseMedicines";
import { PatientDocumentType } from "../api/models/PatientDocumentType";
import { PatientDocument } from "../api/models/PatientDocument";
import { MeasureUnitTypes } from "../api/models/MeasureUnitTypes";
import { AnesthesiaProcedureForm } from "../api/models/AnesthesiaProcedureForm";
import { InsuranceType } from "../api/models/InsuranceType";
import { FoodExtraType } from "../api/models/FoodExtraType";
import { ExaminationType } from "../api/models/ExaminationType";
import { CaseFoodExtras } from "../api/models/CaseFoodExtras";
import { CaseDailyDetailsFoodExtras } from "../api/models/CaseDailyDetailsFoodExtras";
import { CaseExaminations } from "../api/models/CaseExaminations";
import { CaseDailyDetailsExaminations } from "../api/models/CaseDailyDetailsExaminations";
import { MasterCase } from "../api/models/MasterCase";
import { MasterCaseCases } from "../api/models/MasterCaseCases";
import { ProcedureType } from "../api/models/ProcedureType";
import { CaseProcedures } from "../api/models/CaseProcedures";
import { CaseDailyDetailsProcedures } from "../api/models/CaseDailyDetailsProcedures";
import { AnimalVitals } from "../api/models/AnimalVitals";
import { AuditLog } from "../api/models/AuditLog";

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_SCHEMA } = process.env;
let { DB_NAME } = process.env;
if (process.env.NODE_ENV == "test") DB_NAME = process.env.DB_NAME_TEST;

export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
  port: parseInt(DB_PORT!),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  schema: DB_SCHEMA,
  synchronize: true,
  logging: false,
  entities: [
    User,
    AnimalType,
    AuditLog,
    GenderType,
    AnimalColor,
    UrineType,
    FoodType,
    FecesType,
    RaceType,
    UserRole,
    UserPrivilege,
    Case,
    Patient,
    CaseDailyDetails,
    Medicine,
    MedicineCategory,
    RouteOfAdministration,
    DosageFrequency,
    CaseDailyDetailsMedicines,
    PatientMedicine,
    CaseMedicines,
    PatientDocument,
    PatientDocumentType,
    MeasureUnitTypes,
    AnesthesiaProcedureForm,
    InsuranceType,
    FoodExtraType,
    ExaminationType,
    CaseFoodExtras,
    CaseDailyDetailsFoodExtras,
    CaseExaminations,
    CaseDailyDetailsExaminations,
    MasterCase,
    MasterCaseCases,
    ProcedureType,
    CaseProcedures,
    CaseDailyDetailsProcedures,
    AnimalVitals,
  ],
});

export const getQueryRunner = () => {
  return AppDataSource.createQueryRunner();
};
