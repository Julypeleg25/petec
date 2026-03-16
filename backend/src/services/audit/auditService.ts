import { logger } from "@config/logger";
import { auditRepository } from "@repositories/audit";
import type { Types } from "mongoose";

const MODULE = "audit";

export class AuditService {
  async logPatientCreate(
    patientId: string,
    patientName: string,
    userId: string,
  ): Promise<void> {
    await auditRepository.log(
      "Patient Management",
      `Patient created: ${patientName}`,
      "Patient",
      patientId,
      userId,
    );
    logger.info("Audit: patient created", {
      module: MODULE,
      patient_id: patientId,
      user_id: userId,
    });
  }

  async logPatientEdit(
    caseSerialId: string,
    patientName: string,
    userId: string,
  ): Promise<void> {
    await auditRepository.log(
      "Patient Management",
      `Patient/case edited: ${patientName}`,
      "Case",
      caseSerialId,
      userId,
    );
    logger.info("Audit: patient edited", {
      module: MODULE,
      case_serial_id: caseSerialId,
      user_id: userId,
    });
  }

  async logGridSave(
    caseSerialId: string,
    rowCount: number,
    userId: string,
  ): Promise<void> {
    await auditRepository.log(
      "Case Grid",
      `Grid saved: ${rowCount} rows`,
      "Case",
      caseSerialId,
      userId,
    );
    logger.info("Audit: grid saved", {
      module: MODULE,
      case_serial_id: caseSerialId,
      row_count: rowCount,
      user_id: userId,
    });
  }

  async logCaseRelease(
    caseId: string | Types.ObjectId,
    userId: string,
  ): Promise<void> {
    const idStr = caseId.toString();
    await auditRepository.log(
      "Patient Management",
      "Patient released",
      "Case",
      idStr,
      userId,
    );
    logger.info("Audit: case released", {
      module: MODULE,
      case_id: idStr,
      user_id: userId,
    });
  }

  async logCaseArchive(
    caseId: string | Types.ObjectId,
    isArchived: boolean,
    userId: string,
  ): Promise<void> {
    const idStr = caseId.toString();
    await auditRepository.log(
      "Patient Management",
      isArchived ? "Case archived" : "Case restored from archive",
      "Case",
      idStr,
      userId,
    );
    logger.info("Audit: case archive toggled", {
      module: MODULE,
      case_id: idStr,
      is_archived: isArchived,
      user_id: userId,
    });
  }

  async logCaseDelete(
    caseId: string | Types.ObjectId,
    userId: string,
  ): Promise<void> {
    const idStr = caseId.toString();
    await auditRepository.log(
      "Patient Management",
      "Case deleted",
      "Case",
      idStr,
      userId,
    );
    logger.info("Audit: case deleted", {
      module: MODULE,
      case_id: idStr,
      user_id: userId,
    });
  }

  async logDocumentUpload(
    documentId: string,
    fileName: string,
    patientId: string,
    userId: string,
  ): Promise<void> {
    await auditRepository.log(
      "Patient Management",
      `Document uploaded: ${fileName}`,
      "Patient",
      patientId,
      userId,
    );
    logger.info("Audit: document uploaded", {
      module: MODULE,
      doc_id: documentId,
      patient_id: patientId,
      user_id: userId,
    });
  }

  async logDocumentDelete(
    documentId: string,
    fileName: string,
    patientId: string,
    userId: string,
  ): Promise<void> {
    await auditRepository.log(
      "Patient Management",
      `Document deleted: ${fileName}`,
      "Patient",
      patientId,
      userId,
    );
    logger.info("Audit: document deleted", {
      module: MODULE,
      doc_id: documentId,
      patient_id: patientId,
      user_id: userId,
    });
  }

  async logExportCreated(
    caseSerialId: string,
    bytes: number,
    userId: string,
  ): Promise<void> {
    await auditRepository.log(
      "Case Export",
      `Export created: ${bytes} bytes`,
      "Case",
      caseSerialId,
      userId,
    );
    logger.info("Audit: export created", {
      module: MODULE,
      case_serial_id: caseSerialId,
      bytes,
      user_id: userId,
    });
  }
}

export const auditService = new AuditService();
