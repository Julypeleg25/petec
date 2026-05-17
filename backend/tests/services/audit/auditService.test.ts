import { jest } from "@jest/globals";

const auditLogMock = jest.fn<(...args: any[]) => Promise<void>>();
const infoMock = jest.fn<(...args: any[]) => void>();

jest.unstable_mockModule("../../../src/repositories/audit/index.js", () => ({
  auditRepository: {
    log: auditLogMock,
  },
}));

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
  },
}));

const { AuditService } = await import("../../../src/services/audit/auditService.js");

describe("AuditService", () => {
  const service = new AuditService();

  beforeEach(() => {
    auditLogMock.mockReset();
    infoMock.mockReset();
  });

  it.each([
    [
      "patient create",
      () => service.logPatientCreate("patient-1", "Nina", "user-1"),
      ["Patient Management", "Patient created: Nina", "Patient", "patient-1", "user-1"],
      "Audit: patient created",
      { module: "audit", patient_id: "patient-1", user_id: "user-1" },
    ],
    [
      "patient edit",
      () => service.logPatientEdit("case-serial-1", "Nina", "user-2"),
      ["Patient Management", "Patient/case edited: Nina", "Case", "case-serial-1", "user-2"],
      "Audit: patient edited",
      { module: "audit", case_serial_id: "case-serial-1", user_id: "user-2" },
    ],
    [
      "grid save",
      () => service.logGridSave("case-serial-2", 4, "user-3"),
      ["Case Grid", "Grid saved: 4 rows", "Case", "case-serial-2", "user-3"],
      "Audit: grid saved",
      { module: "audit", case_serial_id: "case-serial-2", row_count: 4, user_id: "user-3" },
    ],
    [
      "case release",
      () => service.logCaseRelease({ toString: () => "case-1" } as never, "user-4"),
      ["Patient Management", "Patient released", "Case", "case-1", "user-4"],
      "Audit: case released",
      { module: "audit", case_id: "case-1", user_id: "user-4" },
    ],
    [
      "case archive on",
      () => service.logCaseArchive({ toString: () => "case-2" } as never, true, "user-5"),
      ["Patient Management", "Case archived", "Case", "case-2", "user-5"],
      "Audit: case archive toggled",
      { module: "audit", case_id: "case-2", is_archived: true, user_id: "user-5" },
    ],
    [
      "case archive off",
      () => service.logCaseArchive({ toString: () => "case-3" } as never, false, "user-6"),
      ["Patient Management", "Case restored from archive", "Case", "case-3", "user-6"],
      "Audit: case archive toggled",
      { module: "audit", case_id: "case-3", is_archived: false, user_id: "user-6" },
    ],
    [
      "case delete",
      () => service.logCaseDelete({ toString: () => "case-4" } as never, "user-7"),
      ["Patient Management", "Case deleted", "Case", "case-4", "user-7"],
      "Audit: case deleted",
      { module: "audit", case_id: "case-4", user_id: "user-7" },
    ],
    [
      "document upload",
      () => service.logDocumentUpload("doc-1", "report.pdf", "patient-2", "user-8"),
      ["Patient Management", "Document uploaded: report.pdf", "Patient", "patient-2", "user-8"],
      "Audit: document uploaded",
      { module: "audit", doc_id: "doc-1", patient_id: "patient-2", user_id: "user-8" },
    ],
    [
      "document delete",
      () => service.logDocumentDelete("doc-2", "scan.pdf", "patient-3", "user-9"),
      ["Patient Management", "Document deleted: scan.pdf", "Patient", "patient-3", "user-9"],
      "Audit: document deleted",
      { module: "audit", doc_id: "doc-2", patient_id: "patient-3", user_id: "user-9" },
    ],
    [
      "export created",
      () => service.logExportCreated("case-serial-9", 512, "user-10"),
      ["Case Export", "Export created: 512 bytes", "Case", "case-serial-9", "user-10"],
      "Audit: export created",
      { module: "audit", case_serial_id: "case-serial-9", bytes: 512, user_id: "user-10" },
    ],
  ] as const)(
    "writes audit and logger entries for %s",
    async (_label, invoke, expectedAuditArgs, expectedLogMessage, expectedLogMeta) => {
      auditLogMock.mockResolvedValue(undefined);

      await expect(invoke()).resolves.toBeUndefined();

      expect(auditLogMock).toHaveBeenCalledWith(...expectedAuditArgs);
      expect(infoMock).toHaveBeenCalledWith(expectedLogMessage, expectedLogMeta);
    },
  );
});
