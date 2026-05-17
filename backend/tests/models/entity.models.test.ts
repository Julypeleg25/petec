import { CASE_SERIAL_ID_REGEX, roles, UserStatus } from "@petec/shared";
import {
  AnesthesiaFormModel,
  AuditLogModel,
  MasterCaseModel,
  PatientDocumentModel,
  PatientMedicineModel,
  PatientModel,
  UserModel,
} from "../../src/models/index.js";

const hasIndex = (
  indexes: Array<[Record<string, unknown>, Record<string, unknown>]>,
  fields: Record<string, unknown>,
  options: Record<string, unknown> = {},
): boolean =>
  indexes.some(
    ([actualFields, actualOptions]) =>
      JSON.stringify(actualFields) === JSON.stringify(fields)
      && Object.entries(options).every(([key, value]) => actualOptions[key] === value),
  );

describe("entity models", () => {
  it("defines the patient model schema and indexes", () => {
    const schema = PatientModel.schema;
    const refsSchema = schema.path("refs") as unknown as { schema: typeof schema };

    expect(PatientModel.collection.collectionName).toBe("patients");
    expect(schema.options.timestamps).toBe(true);
    expect(schema.options.versionKey).toBe(false);
    expect(schema.path("serialId").options.match?.source).toBe(CASE_SERIAL_ID_REGEX.source);
    expect(schema.path("serialId").options.match?.flags).toBe(CASE_SERIAL_ID_REGEX.flags);
    expect(schema.path("name").options.required).toBe(true);
    expect(schema.path("name").options.index).toBe(true);
    expect(schema.path("owner").options.required).toBe(true);
    expect(schema.path("photoName").instance).toBe("String");
    expect(refsSchema.schema.path("animalTypeId").options.ref).toBe("AnimalType");
    expect(refsSchema.schema.path("foodTypeId").options.ref).toBe("FoodType");

    const indexes = schema.indexes();
    expect(hasIndex(indexes, { "owner.phone": 1 })).toBe(true);
    expect(hasIndex(indexes, { serialId: 1 }, { sparse: true })).toBe(true);
  });

  it("defines the user model schema with security-sensitive selections disabled", () => {
    const schema = UserModel.schema;
    const refreshTokensPath = schema.path("refreshTokens") as unknown as {
      schema: typeof schema;
      options: Record<string, unknown>;
    };

    expect(UserModel.collection.collectionName).toBe("users");
    expect(schema.options.timestamps).toBe(true);
    expect(schema.options.versionKey).toBe(false);
    expect(schema.path("username").options.unique).toBe(true);
    expect(schema.path("email").options.lowercase).toBe(true);
    expect(schema.path("email").options.index).toBe(true);
    expect(schema.path("passwordHash").options.select).toBe(false);
    expect(schema.path("role").options.enum).toEqual(Object.values(roles));
    expect(schema.path("status").options.default).toBe(UserStatus.ACTIVE);
    expect(schema.path("isDeleted").options.default).toBe(false);
    expect(refreshTokensPath.options.select).toBe(false);
    expect(refreshTokensPath.schema.path("tokenHash").options.required).toBe(true);
    expect(refreshTokensPath.schema.path("expiresAt").options.required).toBe(true);
  });

  it("defines the audit log model with created-at-only timestamps and indexes", () => {
    const schema = AuditLogModel.schema;
    const timestamps = schema.options.timestamps as Record<string, unknown>;

    expect(AuditLogModel.collection.collectionName).toBe("audit_logs");
    expect(timestamps.createdAt).toBe(true);
    expect(timestamps.updatedAt).toBe(false);
    expect(schema.options.versionKey).toBe(false);
    expect(schema.path("entityType").options.required).toBe(true);
    expect(schema.path("entityId").options.required).toBe(true);
    expect(schema.path("performedByUserId").options.ref).toBe("User");

    const indexes = schema.indexes();
    expect(hasIndex(indexes, { entityType: 1, entityId: 1, createdAt: -1 })).toBe(true);
    expect(hasIndex(indexes, { createdAt: 1 })).toBe(true);
  });

  it("defines the master case model with case references", () => {
    const schema = MasterCaseModel.schema;
    const caseIdsPath = schema.path("caseIds") as unknown as {
      options: Record<string, unknown>;
    };
    const caseIdsDefinition = (
      schema.obj.caseIds as { type: Array<Record<string, unknown>> }
    ).type[0];

    expect(MasterCaseModel.collection.collectionName).toBe("master_cases");
    expect(schema.options.timestamps).toBe(true);
    expect(schema.options.versionKey).toBe(false);
    expect(caseIdsPath.options.default).toEqual([]);
    expect(caseIdsPath.options.index).toBe(true);
    expect(caseIdsDefinition.ref).toBe("Case");
  });

  it("defines the anesthesia form model", () => {
    const schema = AnesthesiaFormModel.schema;

    expect(AnesthesiaFormModel.collection.collectionName).toBe("anesthesia_forms");
    expect(schema.path("caseId").options.ref).toBe("Case");
    expect(schema.path("caseId").options.required).toBe(true);
    expect(schema.path("caseId").options.unique).toBe(true);
    expect(schema.path("caseId").options.index).toBe(true);
    expect(schema.path("createdByUserId").options.ref).toBe("User");
    expect(schema.path("updatedByUserId").options.ref).toBe("User");
  });

  it("defines the patient document model", () => {
    const schema = PatientDocumentModel.schema;

    expect(PatientDocumentModel.collection.collectionName).toBe("patient_documents");
    expect(schema.path("patientId").options.ref).toBe("Patient");
    expect(schema.path("patientId").options.required).toBe(true);
    expect(schema.path("caseId").options.ref).toBe("Case");
    expect(schema.path("patientDocumentTypeId").options.ref).toBe("PatientDocumentType");
    expect(schema.path("patientDocumentTypeId").options.required).toBe(true);
    expect(schema.path("fileName").options.required).toBe(true);
    expect(schema.path("storageKey").options.required).toBe(true);
    expect(schema.path("uploadedByUserId").options.ref).toBe("User");
    expect(typeof schema.path("uploadedAt").options.default).toBe("function");
  });

  it("defines the patient medicine model and compound index", () => {
    const schema = PatientMedicineModel.schema;

    expect(PatientMedicineModel.collection.collectionName).toBe("patient_medicines");
    expect(schema.path("patientId").options.ref).toBe("Patient");
    expect(schema.path("patientId").options.required).toBe(true);
    expect(schema.path("caseId").options.ref).toBe("Case");
    expect(schema.path("medicineId").options.ref).toBe("Medicine");
    expect(schema.path("medicineId").options.required).toBe(true);
    expect(schema.path("dosageFrequencyId").options.ref).toBe("DosageFrequency");
    expect(schema.path("routeOfAdministrationId").options.ref).toBe("RouteOfAdministration");
    expect(schema.path("measureUnitTypeId").options.ref).toBe("MeasureUnitType");
    expect(schema.path("isDeleted").options.default).toBe(false);

    expect(hasIndex(schema.indexes(), { patientId: 1, isDeleted: 1 })).toBe(true);
  });
});
