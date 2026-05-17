import { Types } from "mongoose";
import {
  mapReleaseMedicineToData,
  mapUploadDocumentToData,
} from "../../../src/mappers/patient/patient.release-document.mappers.js";

describe("patient.release-document.mappers", () => {
  it("maps release medicines with optional object ids and dates", () => {
    const patientId = new Types.ObjectId();
    const caseId = new Types.ObjectId();
    const medicineId = new Types.ObjectId().toString();
    const dosageFrequencyId = new Types.ObjectId().toString();
    const routeId = new Types.ObjectId().toString();
    const measureUnitId = new Types.ObjectId().toString();

    const result = mapReleaseMedicineToData(
      {
        medicineId,
        dosageFrequencyId,
        routeOfAdministrationId: routeId,
        measureUnitTypeId: measureUnitId,
        doseAmount: 2.5,
        notes: "With food",
        startDate: "2026-04-21T00:00:00.000Z",
        endDate: "2026-04-25T00:00:00.000Z",
      } as never,
      patientId,
      caseId,
    );

    expect(result.patientId.toString()).toBe(patientId.toString());
    expect(result.caseId.toString()).toBe(caseId.toString());
    expect(result.medicineId.toString()).toBe(medicineId);
    expect(result.dosageFrequencyId?.toString()).toBe(dosageFrequencyId);
    expect(result.routeOfAdministrationId?.toString()).toBe(routeId);
    expect(result.measureUnitTypeId?.toString()).toBe(measureUnitId);
    expect(result.doseAmount).toBe(2.5);
    expect(result.notes).toBe("With food");
    expect(result.startDate?.toISOString()).toBe("2026-04-21T00:00:00.000Z");
    expect(result.endDate?.toISOString()).toBe("2026-04-25T00:00:00.000Z");
  });

  it("omits optional release medicine fields when they are empty", () => {
    const result = mapReleaseMedicineToData(
      {
        medicineId: new Types.ObjectId().toString(),
        doseAmount: "",
      } as never,
      new Types.ObjectId(),
      new Types.ObjectId(),
    );

    expect(result).not.toHaveProperty("dosageFrequencyId");
    expect(result).not.toHaveProperty("routeOfAdministrationId");
    expect(result).not.toHaveProperty("measureUnitTypeId");
    expect(result).not.toHaveProperty("doseAmount");
    expect(result).not.toHaveProperty("notes");
    expect(result).not.toHaveProperty("startDate");
    expect(result).not.toHaveProperty("endDate");
  });

  it("maps uploaded documents to storage data", () => {
    const patientId = new Types.ObjectId().toString();
    const documentTypeId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const caseId = new Types.ObjectId();
    const before = Date.now();

    const result = mapUploadDocumentToData(
      {
        patientId,
        patientDocumentTypeId: documentTypeId,
      } as never,
      "patients/docs/file.pdf",
      "cloudinary-123",
      "file.pdf",
      userId,
      caseId,
    );

    expect(result.patientId.toString()).toBe(patientId);
    expect(result.caseId.toString()).toBe(caseId.toString());
    expect(result.patientDocumentTypeId.toString()).toBe(documentTypeId);
    expect(result.storageKey).toBe("patients/docs/file.pdf");
    expect(result.cloudinaryPublicId).toBe("cloudinary-123");
    expect(result.fileName).toBe("file.pdf");
    expect(result.uploadedByUserId.toString()).toBe(userId);
    expect(result.uploadedAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});
