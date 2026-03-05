import { patientRepository } from "@repositories/patient.repository";
import { caseRepository } from "@repositories/case.repository";
import { masterCaseRepository } from "@repositories/masterCase.repository";
import { anesthesiaFormRepository } from "@repositories/anesthesiaForm.repository";
import { documentRepository } from "@repositories/document.repository";
import { patientMedicineRepository } from "@repositories/patientMedicine.repository";
import { auditRepository } from "@repositories/audit.repository";
import { storageService } from "@services/storage.service";
import { caseGridService } from "@services/caseGrid.service";
import { logger } from "@config/logger";
import { NotFoundError, BadRequestError } from "@constants/error.constants";
import {
  toAnesthesiaFormDTO,
  toCaseDetailsResponseDTO,
  withMasterCaseDetails,
  toPatientDocumentResponseDTO,
  toReleasePatientDataResponseDTO,
} from "@mappers/patient/patient.response.mappers";
import {
  isPhotoStorageKey,
  mapCaseToChartsDataResponse,
  mapCaseToDailyPlanDetail,
  mapRelatedCasesToMasterCaseDetails,
  toPhotoContentType,
} from "@mappers/patient/patient.service.mappers";
import {
  getCaseSerialPrefix,
  type NewPatientDTO,
  type EditPatientDTO,
  type ReleasePatientDTO,
  type UploadDocumentDTO,
  type CreatePatientResponseDTO,
  type PatientDocumentResponseDTO,
  type ChartsDataResponseDTO,
  type DailyPlanDetailDTO,
  type UpdateDailyPlanRequestDTO,
  type CreateAnesthesiaProcedureFormDTO,
  type CaseDetailsResponseDTO,
  type ReleasePatientDataResponseDTO,
} from "@petec/shared";
import type { ICase, CaseDocument } from "@models/Case";
import type { ReadStream } from "node:fs";

import { toObjectId } from "@utils/objectId.utils";
import { toPatientPhotoUrl } from "@utils/patientPhoto.utils";
import {
  mapNewPatientDtoToPatientData,
  mapNewPatientDtoToCaseData,
  mapEditDtoToPatientUpdate,
  mapEditDtoToCaseUpdate,
  mapReleaseMedicineToData,
  mapUploadDocumentToData,
  mapGridDtoToRows,
} from "@mappers/patient/patient.mappers";
import type {
  AnesthesiaFormUpsertData,
  CaseWithPopulatedPatient,
  MedWithPopulatedName,
} from "@app-types/patient.types";
import {
  ensureDedicatedPatientForCase,
  getCaseByIdOrThrow,
  getCaseByIdPopulatedOrThrow,
  getCaseBySerialIdOrThrow,
  resolveMasterCaseBySerialPrefix,
} from "@services/utils/patient.service.utils";

const MODULE = "patient";
const ENTITY_TYPE_PATIENT = "Patient";
const ENTITY_TYPE_CASE = "Case";
const AUDIT_SUBJECT_PATIENT = "Patient Management";

export class PatientService {
  async createPatientAndCase(
    dto: NewPatientDTO,
    userId: string,
  ): Promise<CreatePatientResponseDTO> {
    const existingCaseBySerial = await caseRepository.findBySerialId(dto.caseId);
    if (existingCaseBySerial) {
      throw new BadRequestError("Case with this serial id already exists");
    }

    let patientIdForCase: ICase["patientId"];
    let masterCaseIdForCase: NonNullable<ICase["masterCaseId"]>;

    const existingMasterCaseId = await resolveMasterCaseBySerialPrefix(
      dto.caseId,
    );
    if (existingMasterCaseId) {
      const patientData = mapNewPatientDtoToPatientData(dto);
      const patient = await patientRepository.create(patientData);

      patientIdForCase = patient._id;
      masterCaseIdForCase = existingMasterCaseId;
    } else {
      const patientData = mapNewPatientDtoToPatientData(dto);
      const patient = await patientRepository.create(patientData);

      const masterCase = await masterCaseRepository.create({
        caseIds: [],
      });

      patientIdForCase = patient._id;
      masterCaseIdForCase = masterCase._id;
    }

    const caseData = mapNewPatientDtoToCaseData(
      dto,
      patientIdForCase,
      masterCaseIdForCase,
      userId,
    );
    const newCase = await caseRepository.create(caseData);
    if (existingMasterCaseId) {
      await masterCaseRepository.addCaseId(masterCaseIdForCase, newCase._id);
    } else {
      await masterCaseRepository.updateById(masterCaseIdForCase, {
        $set: { caseIds: [newCase._id] },
      });
    }

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      `Patient case created: ${dto.name}`,
      ENTITY_TYPE_PATIENT,
      patientIdForCase.toString(),
      userId,
    );

    logger.info("Patient and case created", {
      module: MODULE,
      patient_id: patientIdForCase.toString(),
      case_id: newCase._id.toString(),
      case_serial_id: dto.caseId,
      master_case_id: masterCaseIdForCase.toString(),
    });

    return {
      patientId: patientIdForCase.toString(),
      caseId: newCase._id.toString(),
      masterCaseId: masterCaseIdForCase.toString(),
    };
  }

  async editPatientAndCase(dto: EditPatientDTO, userId: string): Promise<void> {
    const existingCase = await getCaseBySerialIdOrThrow(dto.caseId);

    if (existingCase.isArchived) {
      throw new BadRequestError("Cannot edit an archived case");
    }

    const patientIdForCase = await ensureDedicatedPatientForCase(
      existingCase,
    );
    const patient = await patientRepository.findById(patientIdForCase);
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }

    const patientUpdate = mapEditDtoToPatientUpdate(dto);
    if (Object.keys(patientUpdate).length > 0) {
      await patientRepository.updateById(patient._id, { $set: patientUpdate });
    }

    if (dto.caseDetails && dto.caseDetails.length > 0) {
      const gridRows = mapGridDtoToRows(dto.caseDetails);
      await caseGridService.saveGrid(existingCase.serialId, gridRows);
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

    logger.info("Patient and case edited", {
      module: MODULE,
      patient_id: patient._id.toString(),
      case_serial_id: dto.caseId,
    });
  }

  async getCaseDetails(
    caseId: string,
    _masterCaseId?: string,
  ): Promise<CaseDetailsResponseDTO> {
    const caseDocForIsolation = await getCaseByIdOrThrow(caseId);
    await ensureDedicatedPatientForCase(caseDocForIsolation);
    const caseDoc = await getCaseByIdPopulatedOrThrow(caseId);

    const caseDetailsResponse = toCaseDetailsResponseDTO(
      caseDoc.toObject() as CaseWithPopulatedPatient,
    );
    const resolvedMasterCaseId = caseDoc.masterCaseId?.toString();
    let relatedCases: CaseDocument[];

    if (resolvedMasterCaseId) {
      relatedCases = await caseRepository.findMany(
        { masterCaseId: resolvedMasterCaseId, isDeleted: false },
        { sort: { createdAt: -1 }, populate: "patientId" },
      );
    } else {
      const serialPrefix = getCaseSerialPrefix(caseDoc.serialId);
      relatedCases = serialPrefix
        ? await caseRepository.findMany(
          {
            serialId: new RegExp(`^${serialPrefix}-\\d{6,}$`),
            isDeleted: false,
          },
          { sort: { createdAt: -1 }, populate: "patientId" },
        )
        : [];
    }

    if (relatedCases.length === 0) {
      return caseDetailsResponse;
    }

    return withMasterCaseDetails(
      caseDetailsResponse,
      mapRelatedCasesToMasterCaseDetails(
        relatedCases.map(
          (relatedCase) =>
            relatedCase.toObject() as CaseWithPopulatedPatient,
        ),
      ),
    );
  }

  async releasePatient(dto: ReleasePatientDTO, userId: string): Promise<void> {
    const existingCase = await getCaseBySerialIdOrThrow(dto.caseId);

    if (existingCase.releaseDate) {
      throw new BadRequestError("Patient is already released");
    }

    const dateUpdates: ICase["dates"] = { ...existingCase.dates };
    if (dto.stitchesRemovalDate)
      dateUpdates.stitchesRemovalDate = dto.stitchesRemovalDate;
    if (dto.nextInspectionDate)
      dateUpdates.nextInspectionDate = dto.nextInspectionDate;

    await caseRepository.release(existingCase._id, userId, {
      dates: dateUpdates,
    });

    if (dto.medicines.length > 0) {
      for (const med of dto.medicines) {
        const medData = mapReleaseMedicineToData(
          med,
          existingCase.patientId,
          existingCase._id,
        );
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

    logger.info("Case released", {
      module: MODULE,
      case_id: existingCase._id.toString(),
    });
  }

  async archivePatientCase(caseId: string, userId: string): Promise<void> {
    const existingCase = await getCaseBySerialIdOrThrow(caseId);
    const nextArchiveState = !existingCase.isArchived;

    await caseRepository.archive(existingCase._id, nextArchiveState);

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      nextArchiveState ? "Case archived" : "Case restored from archive",
      ENTITY_TYPE_CASE,
      existingCase._id.toString(),
      userId,
    );

    logger.info("Case archive status updated", {
      module: MODULE,
      case_id: existingCase._id.toString(),
      is_archived: nextArchiveState,
    });
  }

  async deletePatientCase(caseId: string, userId: string): Promise<void> {
    const existingCase = await getCaseBySerialIdOrThrow(caseId);

    await caseRepository.softDelete(existingCase._id);

    if (existingCase.masterCaseId) {
      await masterCaseRepository.removeCaseId(
        existingCase.masterCaseId,
        existingCase._id,
      );
    }

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      "Case deleted",
      ENTITY_TYPE_CASE,
      existingCase._id.toString(),
      userId,
    );

    logger.info("Case deleted", {
      module: MODULE,
      case_id: existingCase._id.toString(),
    });
  }

  async getPatientDocuments(
    patientId: string,
  ): Promise<PatientDocumentResponseDTO[]> {
    const docs = await documentRepository.findByPatientId(patientId);
    return docs.map((d) => toPatientDocumentResponseDTO(d.toObject()));
  }

  async uploadDocumentMetadata(
    dto: UploadDocumentDTO,
    storageKey: string,
    fileName: string,
    userId: string,
  ): Promise<PatientDocumentResponseDTO> {
    const resolvedCaseObjectId = dto.caseId
      ? (await caseRepository.findBySerialId(dto.caseId))?._id
      : undefined;
    const docData = mapUploadDocumentToData(
      dto,
      storageKey,
      fileName,
      userId,
      resolvedCaseObjectId,
    );
    const doc = await documentRepository.create(docData);

    try {
      await auditRepository.log(
        AUDIT_SUBJECT_PATIENT,
        `Document uploaded: ${fileName}`,
        ENTITY_TYPE_PATIENT,
        dto.patientId,
        userId,
      );
    } catch (auditError) {
      logger.warn("Document upload audit log failed", {
        module: MODULE,
        patient_id: dto.patientId,
        error: auditError,
      });
    }

    logger.info("Document uploaded", {
      module: MODULE,
      doc_id: doc._id.toString(),
      patient_id: dto.patientId,
    });

    return toPatientDocumentResponseDTO(doc.toObject());
  }

  async uploadPatientPhoto(
    patientId: string,
    storageKey: string,
    userId: string,
  ): Promise<string> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }

    if (!isPhotoStorageKey(storageKey)) {
      throw new BadRequestError("Invalid photo storage key");
    }

    const previousPhotoKey = patient.photoName;
    await patientRepository.updateById(patient._id, {
      $set: { photoName: storageKey },
    });

    if (
      previousPhotoKey &&
      isPhotoStorageKey(previousPhotoKey) &&
      previousPhotoKey !== storageKey
    ) {
      await storageService.delete(previousPhotoKey).catch((deleteError) => {
        logger.warn("Previous patient photo delete failed", {
          module: MODULE,
          patient_id: patient._id.toString(),
          previous_photo_key: previousPhotoKey,
          error: deleteError,
        });
      });
    }

    try {
      await auditRepository.log(
        AUDIT_SUBJECT_PATIENT,
        "Patient photo updated",
        ENTITY_TYPE_PATIENT,
        patient._id.toString(),
        userId,
      );
    } catch (auditError) {
      logger.warn("Patient photo audit log failed", {
        module: MODULE,
        patient_id: patient._id.toString(),
        error: auditError,
      });
    }

    logger.info("Patient photo updated", {
      module: MODULE,
      patient_id: patient._id.toString(),
    });

    return (
      toPatientPhotoUrl(patient._id.toString(), storageKey, new Date()) ??
      storageKey
    );
  }

  async getPatientPhotoStream(
    patientId: string,
  ): Promise<{ stream: ReadStream; contentType: string }> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }

    const storageKey = patient.photoName;
    if (!storageKey || !isPhotoStorageKey(storageKey)) {
      throw new NotFoundError("Patient photo not found");
    }

    const exists = await storageService.exists(storageKey);
    if (!exists) {
      throw new NotFoundError("Patient photo not found");
    }

    return {
      stream: storageService.createReadStream(storageKey),
      contentType: toPhotoContentType(storageKey),
    };
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new NotFoundError("Document not found");
    }

    await storageService.delete(doc.storageKey);
    await documentRepository.deleteById(documentId);

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      `Document deleted: ${doc.fileName}`,
      ENTITY_TYPE_PATIENT,
      doc.patientId.toString(),
      userId,
    );

    logger.info("Document deleted", { module: MODULE, doc_id: documentId });
  }

  async getAnesthesiaForm(
    caseId: string,
  ): Promise<CreateAnesthesiaProcedureFormDTO | null> {
    await getCaseByIdPopulatedOrThrow(caseId);
    const form = await anesthesiaFormRepository.findByCaseId(caseId);
    if (!form) return null;
    return toAnesthesiaFormDTO(form.toObject());
  }

  async upsertAnesthesiaForm(
    caseId: string,
    data: CreateAnesthesiaProcedureFormDTO,
    userId: string,
  ): Promise<CreateAnesthesiaProcedureFormDTO> {
    await getCaseByIdOrThrow(caseId);
    const { caseId: _dtoCaseId, ...formFields } = data;
    const formData: AnesthesiaFormUpsertData = {
      ...formFields,
      updatedByUserId: toObjectId(userId),
    };
    const form = await anesthesiaFormRepository.upsertByCaseId(
      caseId,
      formData,
    );

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      "Anesthesia form updated",
      ENTITY_TYPE_CASE,
      caseId,
      userId,
    );

    logger.info("Anesthesia form upserted", {
      module: MODULE,
      case_id: caseId,
    });

    return toAnesthesiaFormDTO(form.toObject());
  }

  async getReleasePatientData(
    caseId: string,
  ): Promise<ReleasePatientDataResponseDTO> {
    const caseDoc = await getCaseByIdOrThrow(caseId);

    const meds = await patientMedicineRepository.findByCaseId(caseDoc._id);
    return toReleasePatientDataResponseDTO(
      caseDoc.toObject(),
      meds.map((doc) => doc.toObject() as MedWithPopulatedName),
    );
  }

  async getChartsData(caseId: string): Promise<ChartsDataResponseDTO> {
    const caseDoc = await getCaseByIdOrThrow(caseId);
    return mapCaseToChartsDataResponse(caseDoc.toObject());
  }

  async getDailyPlan(): Promise<DailyPlanDetailDTO[]> {
    const cases = await caseRepository.findMany(
      { isDeleted: false, isArchived: false },
      {
        sort: { createdAt: -1 },
        populate: [
          "patientId",
          "planned.examinations.examinationTypeId",
          "planned.procedures.procedureTypeId",
        ],
      },
    );
    return cases.map((caseDoc) => mapCaseToDailyPlanDetail(caseDoc.toObject()));
  }

  async updateDailyPlan(payload: UpdateDailyPlanRequestDTO): Promise<void> {
    const updates = Object.values(payload);

    await Promise.all(
      updates.map(async ({ caseId, comments }) => {
        const caseDoc = await getCaseBySerialIdOrThrow(caseId);
        await caseRepository.updateById(caseDoc._id, {
          $set: {
            dailyPlan: {
              comments,
              updatedAt: new Date(),
            },
          },
        });
      }),
    );
  }

  async exportCase(caseId: string): Promise<Buffer> {
    const caseDoc = await getCaseByIdPopulatedOrThrow(caseId);
    logger.info("Case export requested", {
      module: MODULE,
      case_id: caseDoc._id.toString(),
    });
    const serializedCase = JSON.stringify(caseDoc.toObject(), null, 2);
    return Buffer.from(`Case Export: ${caseId}\n\n${serializedCase}`);
  }
}

export const patientService = new PatientService();
