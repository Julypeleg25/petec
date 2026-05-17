import { CASE_SERIAL_ID_REGEX } from "@petec/shared";
import {
  CaseModel,
  caseSchema,
} from "../../src/models/index.js";
import {
  caseDetailsExamObjSchema,
  caseDetailsFoodExtraObjSchema,
  caseDetailsMedicineObjSchema,
  caseDetailsOptionsObjSchema,
  caseDetailsProcedureObjSchema,
  caseDetailsRowSchema,
} from "../../src/models/case/CaseDetails.schema.js";

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

describe("case models", () => {
  it("defines the top-level case model and schema", () => {
    expect(CaseModel.collection.collectionName).toBe("cases");
    expect(CaseModel.schema).toBe(caseSchema);
    expect(caseSchema.options.timestamps).toBe(true);
    expect(caseSchema.options.versionKey).toBe(false);
    expect(caseSchema.path("patientId").options.ref).toBe("Patient");
    expect(caseSchema.path("patientId").options.required).toBe(true);
    expect(caseSchema.path("serialId").options.match?.source).toBe(CASE_SERIAL_ID_REGEX.source);
    expect(caseSchema.path("serialId").options.match?.flags).toBe(CASE_SERIAL_ID_REGEX.flags);
    expect(caseSchema.path("masterCaseId").options.ref).toBe("MasterCase");
    expect(caseSchema.path("doctorUserId").options.ref).toBe("User");
    expect(caseSchema.path("releasedByUserId").options.ref).toBe("User");
    expect(caseSchema.path("isArchived").options.default).toBe(false);
    expect(caseSchema.path("isManuallyUnarchived").options.default).toBe(false);
    expect(caseSchema.path("isDeleted").options.default).toBe(false);
    expect(caseSchema.path("caseDetailsGrid").options.default).toEqual([]);

    const indexes = caseSchema.indexes();
    expect(hasIndex(indexes, { patientId: 1, isDeleted: 1 })).toBe(true);
    expect(hasIndex(indexes, { isArchived: 1, releaseDate: -1 })).toBe(true);
    expect(hasIndex(indexes, { serialId: 1 }, { unique: true })).toBe(true);
    expect(hasIndex(indexes, { createdAt: 1 })).toBe(true);
    expect(hasIndex(indexes, { "caseDetailsGrid.dateTime": -1 })).toBe(true);
  });

  it("defines the case details medicine schema", () => {
    expect(caseDetailsMedicineObjSchema.path("medicineId").options.ref).toBe("Medicine");
    expect(caseDetailsMedicineObjSchema.path("medicineId").options.required).toBe(true);
    expect(caseDetailsMedicineObjSchema.path("measureUnitTypeId").options.ref).toBe("MeasureUnitType");
    expect(caseDetailsMedicineObjSchema.path("dosageFrequencyId").options.ref).toBe("DosageFrequency");
    expect(caseDetailsMedicineObjSchema.path("routeOfAdministrationId").options.ref).toBe("RouteOfAdministration");
    expect(caseDetailsMedicineObjSchema.path("isRequired").options.required).toBe(true);
    expect(caseDetailsMedicineObjSchema.path("isEditable").options.required).toBe(true);
  });

  it("defines the case details options, procedure, and food extra schemas", () => {
    expect(caseDetailsOptionsObjSchema.path("typeId").options.required).toBe(true);
    expect(caseDetailsOptionsObjSchema.path("isRequired").options.required).toBe(true);
    expect(caseDetailsOptionsObjSchema.path("isEditable").options.required).toBe(true);

    expect(caseDetailsProcedureObjSchema.path("typeId").options.ref).toBe("ProcedureType");
    expect(caseDetailsProcedureObjSchema.path("typeId").options.required).toBe(true);

    expect(caseDetailsFoodExtraObjSchema.path("typeId").options.ref).toBe("FoodExtraType");
    expect(caseDetailsFoodExtraObjSchema.path("typeId").options.required).toBe(true);
  });

  it("defines the case details exam schema", () => {
    expect(caseDetailsExamObjSchema.path("typeId").options.ref).toBe("ExaminationType");
    expect(caseDetailsExamObjSchema.path("typeId").options.required).toBe(true);
    expect(caseDetailsExamObjSchema.path("value").options.default).toBeNull();
    expect(caseDetailsExamObjSchema.path("isRequired").options.required).toBe(true);
    expect(caseDetailsExamObjSchema.path("isEditable").options.required).toBe(true);
  });

  it("defines the case details row schema defaults and required fields", () => {
    expect(caseDetailsRowSchema.path("date").options.required).toBe(true);
    expect(caseDetailsRowSchema.path("time").options.required).toBe(true);
    expect(caseDetailsRowSchema.path("dateTime").options.required).toBe(true);
    expect(caseDetailsRowSchema.path("index").options.required).toBe(true);
    expect(caseDetailsRowSchema.path("urineTypeId").options.ref).toBe("UrineType");
    expect(caseDetailsRowSchema.path("fecesTypeId").options.ref).toBe("FecesType");
    expect(caseDetailsRowSchema.path("foodAndWater").options.default).toBeNull();
    expect(caseDetailsRowSchema.path("foodAndWaterIsRequired").options.default).toBe(false);
    expect(caseDetailsRowSchema.path("foodAndWaterIsEditable").options.default).toBe(true);
    expect(caseDetailsRowSchema.path("fluids").options.default).toEqual([]);
    expect(caseDetailsRowSchema.path("medicines").options.default).toEqual([]);
    expect(caseDetailsRowSchema.path("procedures").options.default).toEqual([]);
    expect(caseDetailsRowSchema.path("examinations").options.default).toEqual([]);
    expect(caseDetailsRowSchema.path("foodExtras").options.default).toEqual([]);
  });
});
