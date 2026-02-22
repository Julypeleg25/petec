import { patientRepository } from "@repositories/patient.repository";
import { caseRepository } from "@repositories/case.repository";
import { masterCaseRepository } from "@repositories/masterCase.repository";
import { anesthesiaFormRepository } from "@repositories/anesthesiaForm.repository";
import { documentRepository } from "@repositories/document.repository";
import { patientMedicineRepository } from "@repositories/patientMedicine.repository";
import { auditRepository } from "@repositories/audit.repository";
import { NotFoundError, BadRequestError } from "@utils/errors";
import {
  mapNewPatientDtoToPatientData,
  mapNewPatientDtoToCaseData,
  mapEditDtoToPatientUpdate,
  mapEditDtoToCaseUpdate,
  mapReleaseMedicineToData,
  mapUploadDocumentToData,
} from "@mappers/patient.mappers";
import type {
  NewPatientDTO,
  EditPatientDTO,
  ReleasePatientDTO,
  UploadDocumentDTO,
  CreatePatientResponseDTO,
  PatientDocumentResponseDTO,
  ChartsDataResponseDTO,
  CreateAnesthesiaProcedureFormDTO,
} from "@petec/shared";
import type { ICase } from "@models/Case";
import type { IAnesthesiaForm } from "@models/AnesthesiaForm";
import type { IPatientDocument } from "@models/PatientDocument";
import type { IPatientMedicine } from "@models/PatientMedicine";

const ENTITY_TYPE_PATIENT = "Patient";
const ENTITY_TYPE_CASE = "Case";
const AUDIT_SUBJECT_PATIENT = "Patient Management";

export class PatientService {
  async createPatientAndCase(dto: NewPatientDTO, userId: string): Promise<CreatePatientResponseDTO> {
    const patientData = mapNewPatientDtoToPatientData(dto);
    const patient = await patientRepository.create(patientData);

    const masterCase = await masterCaseRepository.create({
      patientId: patient._id,
      caseIds: [],
    });

    const caseData = mapNewPatientDtoToCaseData(dto, patient._id, masterCase._id, userId);
    const newCase = await caseRepository.create(caseData as Partial<ICase>);
    await masterCaseRepository.addCaseId(masterCase._id, newCase._id);

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      `Patient created: ${dto.name}`,
      ENTITY_TYPE_PATIENT,
      patient._id.toString(),
      userId,
    );

    return {
      patientId: patient._id.toString(),
      caseId: newCase._id.toString(),
      masterCaseId: masterCase._id.toString(),
    };
  };

  async editPatientAndCase(dto: EditPatientDTO, userId: string): Promise<void> {
    const patient = await patientRepository.findById(dto.patientId);
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }

    const existingCase = await caseRepository.findById(dto.caseId);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    if (existingCase.isArchived) {
      throw new BadRequestError("Cannot edit an archived case");
    }

    const patientUpdate = mapEditDtoToPatientUpdate(dto);
    if (Object.keys(patientUpdate).length > 0) {
      await patientRepository.updateById(patient._id, { $set: patientUpdate });
    }

    const caseUpdate = mapEditDtoToCaseUpdate(dto, existingCase);
    if (Object.keys(caseUpdate).length > 0) {
      await caseRepository.updateById(existingCase._id, { $set: caseUpdate });
    }

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      `Patient/case edited: ${patient.name}`,
      ENTITY_TYPE_CASE,
      existingCase._id.toString(),
      userId,
    );
  };

  async getCaseDetails(caseId: string): Promise<ICase> {
    const caseDoc = await caseRepository.findByIdPopulated(caseId);
    if (!caseDoc) {
      throw new NotFoundError("Case not found");
    }
    return caseDoc.toObject();
  };

  async releasePatient(dto: ReleasePatientDTO, userId: string): Promise<void> {
    const existingCase = await caseRepository.findById(dto.caseId);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    if (existingCase.releaseDate) {
      throw new BadRequestError("Patient is already released");
    }

    const dateUpdates: ICase["dates"] = { ...existingCase.dates };
    if (dto.stitchesRemovalDate) dateUpdates.stitchesRemovalDate = dto.stitchesRemovalDate;
    if (dto.nextInspectionDate) dateUpdates.nextInspectionDate = dto.nextInspectionDate;

    await caseRepository.release(existingCase._id, userId, { dates: dateUpdates });

    if (dto.medicines.length > 0) {
      for (const med of dto.medicines) {
        const medData = mapReleaseMedicineToData(med, existingCase.patientId, existingCase._id);
        await patientMedicineRepository.create(medData);
      }
    }

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      "Patient released",
      ENTITY_TYPE_CASE,
      existingCase._id.toString(),
      userId,
    );
  };

  async archivePatientCase(caseId: string, userId: string): Promise<void> {
    const existingCase = await caseRepository.findById(caseId);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    await caseRepository.archive(existingCase._id);

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      "Case archived",
      ENTITY_TYPE_CASE,
      existingCase._id.toString(),
      userId,
    );
  };

  async deletePatientCase(caseId: string, userId: string): Promise<void> {
    const existingCase = await caseRepository.findById(caseId);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    await caseRepository.softDelete(existingCase._id);

    if (existingCase.masterCaseId) {
      await masterCaseRepository.removeCaseId(existingCase.masterCaseId, existingCase._id);
    }

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      "Case deleted",
      ENTITY_TYPE_CASE,
      existingCase._id.toString(),
      userId,
    );
  };

  async getPatientDocuments(patientId: string): Promise<IPatientDocument[]> {
    const docs = await documentRepository.findByPatientId(patientId);
    return docs.map((d) => d.toObject());
  };

  async uploadDocumentMetadata(
    dto: UploadDocumentDTO,
    storageKey: string,
    fileName: string,
    userId: string,
  ): Promise<IPatientDocument> {
    const docData = mapUploadDocumentToData(dto, storageKey, fileName, userId);
    const doc = await documentRepository.create(docData as Partial<IPatientDocument>);

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      `Document uploaded: ${fileName}`,
      ENTITY_TYPE_PATIENT,
      dto.patientId,
      userId,
    );

    return doc.toObject();
  };

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new NotFoundError("Document not found");
    }

    await documentRepository.deleteById(documentId);

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      `Document deleted: ${doc.fileName}`,
      ENTITY_TYPE_PATIENT,
      doc.patientId.toString(),
      userId,
    );
  };

  async getAnesthesiaForm(caseId: string): Promise<IAnesthesiaForm | null> {
    const form = await anesthesiaFormRepository.findByCaseId(caseId);
    return form ? form.toObject() : null;
  };

  async upsertAnesthesiaForm(
    caseId: string,
    data: CreateAnesthesiaProcedureFormDTO,
    userId: string,
  ): Promise<IAnesthesiaForm> {
    const { caseId: _dtoCaseId, ...formFields } = data;
    const formData: Record<string, unknown> = {
      ...formFields,
      updatedByUserId: new (await import("mongoose")).Types.ObjectId(userId),
    };
    const form = await anesthesiaFormRepository.upsertByCaseId(caseId, formData as Partial<IAnesthesiaForm>);

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      "Anesthesia form updated",
      ENTITY_TYPE_CASE,
      caseId,
      userId,
    );

    return form.toObject();
  };

  async getReleasePatientData(caseId: string): Promise<{ releaseMedicines: IPatientMedicine[] }> {
    const meds = await patientMedicineRepository.findByCaseId(caseId);
    return { releaseMedicines: meds.map((m) => m.toObject()) };
  };

  async getChartsData(caseId: string): Promise<ChartsDataResponseDTO> {
    const caseDoc = await caseRepository.findById(caseId);
    if (!caseDoc) {
      throw new NotFoundError("Case not found");
    }
    return { caseDetailsGrid: caseDoc.caseDetailsGrid };
  };

  async exportPatientCase(caseId: string): Promise<ICase> {
    const caseDoc = await caseRepository.findByIdPopulated(caseId);
    if (!caseDoc) {
      throw new NotFoundError("Case not found");
    }
    return caseDoc.toObject();
  };
}

export const patientService = new PatientService();
