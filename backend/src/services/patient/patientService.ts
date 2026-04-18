import mongoose from "mongoose";
import { patientRepository } from "../../repositories/patient/index.js";
import { caseRepository } from "../../repositories/patient/index.js";
import { masterCaseRepository } from "../../repositories/patient/index.js";
import { anesthesiaFormRepository } from "../../repositories/patient/index.js";
import { documentRepository } from "../../repositories/patient/index.js";
import { patientMedicineRepository } from "../../repositories/patient/index.js";
import { auditRepository } from "../../repositories/audit/index.js";
import { storageService } from "../storage/index.js";
import { caseGridService } from "./index.js";
import { logger } from "../../config/logger.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.utils.js";
import { NotFoundError, BadRequestError } from "../../constants/error.constants.js";
import { PATIENT_STORAGE } from "../../constants/patient.constants.js";
import {
  toAnesthesiaFormDTO,
  toCaseDetailsResponseDTO,
  withMasterCaseDetails,
  toPatientDocumentResponseDTO,
  toReleasePatientDataResponseDTO,
} from "../../mappers/patient/patient.response.mappers.js";
import {
  isPhotoStorageKey,
  mapCaseToChartsDataResponse,
  mapCaseToDailyPlanDetail,
  mapRelatedCasesToMasterCaseDetails,
  toPhotoContentType,
} from "../../mappers/patient/patient.service.mappers.js";
import {
  getCaseSerialPrefix,
  type CalendarMonthResponseDTO,
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
import type { ICase, ICaseDetailsRow, CaseDocument } from "../../models/case/index.js";
import type { ReadStream } from "node:fs";

import { toObjectId } from "../../utils/objectId.utils.js";
import { toPatientPhotoUrl } from "../../utils/patientPhoto.utils.js";
import {
  toCanonicalJerusalemDate,
  toDateInputString,
} from "../../mappers/common/common.mappers.utils.js";
import {
  mapNewPatientDtoToPatientData,
  mapEditDtoToPatientUpdate,
} from "../../mappers/patient/patient.patient-data.mappers.js";
import {
  mapEditDtoToCaseUpdate,
  mapNewPatientDtoToCaseData,
} from "../../mappers/patient/patient.case-data.mappers.js";
import { mapGridDtoToRows } from "../../mappers/patient/patient.case-grid.request.mappers.js";
import {
  mapReleaseMedicineToData,
  mapUploadDocumentToData,
} from "../../mappers/patient/patient.release-document.mappers.js";
import type {
  AnesthesiaFormUpsertData,
  CaseWithPopulatedPatient,
  MedWithPopulatedName,
} from "../../types/patient.types.js";
import {
  ensureDedicatedPatientForCase,
  getCaseByIdOrThrow,
  getCaseByIdPopulatedOrThrow,
  getCaseBySerialIdOrThrow,
  resolveMasterCaseBySerialPrefix,
} from "./utils/patientService.utils.js";
import {
  hasCaseWeightChanged,
  recalculateCaseGridMedicationDoses,
} from "./utils/caseWeightDose.utils.js";
import {
  buildCalendarMonthResponse,
  type CalendarCaseSource,
} from "./utils/patientCalendar.utils.js";

const MODULE = "patient";
const ENTITY_TYPE_PATIENT = "Patient";
const ENTITY_TYPE_CASE = "Case";
const AUDIT_SUBJECT_PATIENT = "Patient Management";
const CALENDAR_QUERY_BUFFER_DAYS = 1;

const shouldPersistManualProcedureUnarchive = (
  flags?: ICase["flags"],
  dates?: ICase["dates"],
): boolean => {
  if (flags?.isProcedure !== true) {
    return false;
  }

  const procedureDateKey = toDateInputString(dates?.procedureDate);
  if (!procedureDateKey) {
    return false;
  }

  const todayKey = toDateInputString(new Date());
  return procedureDateKey !== todayKey;
};

const getCalendarQueryBounds = (
  year: number,
  month: number,
): { queryStart: Date; queryEnd: Date } => {
  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const nextMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const queryStart = new Date(monthStart);
  const queryEnd = new Date(nextMonthStart);

  queryStart.setUTCDate(queryStart.getUTCDate() - CALENDAR_QUERY_BUFFER_DAYS);
  queryEnd.setUTCDate(queryEnd.getUTCDate() + CALENDAR_QUERY_BUFFER_DAYS);

  return { queryStart, queryEnd };
};

type DeletedCaseDocumentAsset = {
  _id: string;
  cloudinaryPublicId?: string;
  fileName: string;
  storageKey: string;
};

const deleteCaseDocumentAsset = async (
  document: DeletedCaseDocumentAsset,
): Promise<void> => {
  if (document.storageKey.startsWith("http")) {
    await deleteFromCloudinary(document.cloudinaryPublicId ?? document.storageKey);
    return;
  }

  await storageService.delete(document.storageKey);
};

export class PatientService {
  async createPatientAndCase(
    dto: NewPatientDTO,
    userId: string,
  ): Promise<CreatePatientResponseDTO> {
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        const existingCaseBySerial = await caseRepository.findBySerialId(dto.caseId, { session });
        if (existingCaseBySerial) {
          throw new BadRequestError("Case with this serial id already exists");
        }

        let patientIdForCase: ICase["patientId"];
        let masterCaseIdForCase: NonNullable<ICase["masterCaseId"]>;

        const existingMasterCaseId = await resolveMasterCaseBySerialPrefix(
          dto.caseId,
          session,
        );

        if (existingMasterCaseId) {
          const patientData = mapNewPatientDtoToPatientData(dto);
          const patient = await patientRepository.create(patientData, { session });

          patientIdForCase = patient._id;
          masterCaseIdForCase = existingMasterCaseId as NonNullable<ICase["masterCaseId"]>;
        } else {
          const patientData = mapNewPatientDtoToPatientData(dto);
          const patient = await patientRepository.create(patientData, { session });

          const masterCase = await masterCaseRepository.create(
            { caseIds: [] },
            { session },
          );

          patientIdForCase = patient._id;
          masterCaseIdForCase = masterCase._id;
        }

        const caseData = mapNewPatientDtoToCaseData(
          dto,
          patientIdForCase,
          masterCaseIdForCase,
          userId,
        );
        const newCase = await caseRepository.create(caseData, { session });

        if (existingMasterCaseId) {
          await masterCaseRepository.addCaseId(masterCaseIdForCase, newCase._id, { session });
        } else {
          await masterCaseRepository.updateById(
            masterCaseIdForCase,
            { $set: { caseIds: [newCase._id] } },
            { session },
          );
        }

        await auditRepository.log(
          AUDIT_SUBJECT_PATIENT,
          `Patient case created: ${dto.name}`,
          ENTITY_TYPE_PATIENT,
          patientIdForCase.toString(),
          userId,
          session,
        );

        logger.info("Patient and case created", {
          module: MODULE,
          event: "patient_case_created",
          user_id: userId,
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
      });
    } finally {
      await session.endSession();
    }
  }

  async editPatientAndCase(dto: EditPatientDTO, userId: string): Promise<void> {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const existingCase = await getCaseBySerialIdOrThrow(dto.caseId, session);

        if (existingCase.isArchived) {
          throw new BadRequestError("Cannot edit an archived case");
        }

        const patientIdForCase = await ensureDedicatedPatientForCase(
          existingCase,
          session,
        );
        const patient = await patientRepository.findById(patientIdForCase, { session });
        if (!patient) {
          throw new NotFoundError("Patient not found");
        }

        const patientUpdate = mapEditDtoToPatientUpdate(dto);
        if (Object.keys(patientUpdate).length > 0) {
          await patientRepository.updateById(patient._id, { $set: patientUpdate }, { session });
        }

        const hasWeightInDto =
          dto.patientSnapshot !== undefined &&
          Object.prototype.hasOwnProperty.call(dto.patientSnapshot, "weightKg");
        const nextWeight = hasWeightInDto
          ? dto.patientSnapshot?.weightKg
          : existingCase.patientSnapshot?.weightKg;
        const shouldRecalculateMedicationDoses = hasCaseWeightChanged(
          existingCase.patientSnapshot?.weightKg,
          nextWeight,
        );

        let gridRows: Partial<ICaseDetailsRow>[] | null = null;
        if (dto.caseDetails) {
          gridRows = mapGridDtoToRows(dto.caseDetails);
        } else if (shouldRecalculateMedicationDoses) {
          gridRows = existingCase.caseDetailsGrid;
        }

        if (gridRows) {
          const nextGridRows = shouldRecalculateMedicationDoses
            ? await recalculateCaseGridMedicationDoses(
              gridRows,
              nextWeight,
              session,
            )
            : gridRows;
          await caseGridService.saveGrid(existingCase.serialId, nextGridRows, session);
        }

        const caseUpdate = mapEditDtoToCaseUpdate(dto, existingCase);
        if (Object.keys(caseUpdate).length > 0) {
          await caseRepository.updateById(existingCase._id, { $set: caseUpdate }, { session });
        }

        await auditRepository.log(
          AUDIT_SUBJECT_PATIENT,
          `Patient/case edited: ${patient.name}`,
          ENTITY_TYPE_CASE,
          existingCase._id.toString(),
          userId,
          session,
        );

        logger.info("Patient and case edited", {
          module: MODULE,
          event: "patient_case_edited",
          user_id: userId,
          patient_id: patient._id.toString(),
          case_id: existingCase._id.toString(),
          case_serial_id: dto.caseId,
        });
      });
    } finally {
      await session.endSession();
    }
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
            serialId: new RegExp(
              `^${serialPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:-[\\d-]+)?$`,
            ),
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
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const existingCase = await getCaseBySerialIdOrThrow(dto.caseId, session);
        const dateUpdates: ICase["dates"] = {
          ...existingCase.dates,
          stitchesRemovalDate:
            dto.stitchesRemovalDate === null
              ? undefined
              : toCanonicalJerusalemDate(dto.stitchesRemovalDate),
          nextInspectionDate:
            dto.nextInspectionDate === null
              ? undefined
              : toCanonicalJerusalemDate(dto.nextInspectionDate),
        };

        await caseRepository.release(existingCase._id, userId, {
          dates: dateUpdates,
        }, session);

        await patientMedicineRepository.deleteMany({ caseId: existingCase._id }, { session });

        for (const med of dto.medicines) {
          const medData = mapReleaseMedicineToData(
            med,
            existingCase.patientId,
            existingCase._id,
          );
          await patientMedicineRepository.create(medData, { session });
        }

        await auditRepository.log(
          AUDIT_SUBJECT_PATIENT,
          "Patient released",
          ENTITY_TYPE_CASE,
          existingCase._id.toString(),
          userId,
          session,
        );

        logger.info("Patient released", {
          module: MODULE,
          event: "patient_released",
          user_id: userId,
          case_id: existingCase._id.toString(),
          case_serial_id: dto.caseId,
        });
      });
    } finally {
      await session.endSession();
    }
  }


  async archivePatientCase(
    caseId: string,
    shouldArchive: boolean,
    userId: string,
  ): Promise<void> {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const existingCase = await getCaseBySerialIdOrThrow(caseId, session);
        const isManuallyUnarchived =
          shouldArchive
            ? false
            : shouldPersistManualProcedureUnarchive(
              existingCase.flags,
              existingCase.dates,
            );
        await caseRepository.updateById(
          existingCase._id,
          {
            $set: {
              isArchived: shouldArchive,
              isManuallyUnarchived,
            },
          },
          { session },
        );

        await auditRepository.log(
          AUDIT_SUBJECT_PATIENT,
          shouldArchive ? "Case archived" : "Case restored from archive",
          ENTITY_TYPE_CASE,
          existingCase._id.toString(),
          userId,
          session,
        );

        logger.info("Case archive status updated", {
          module: MODULE,
          event: shouldArchive
            ? "patient_case_archived"
            : "patient_case_restored",
          user_id: userId,
          case_id: existingCase._id.toString(),
          is_archived: shouldArchive,
        });
      });
    } finally {
      await session.endSession();
    }
  }

  async deletePatientCase(caseId: string, userId: string): Promise<void> {
    const session = await mongoose.startSession();
    let documentAssetsToCleanup: DeletedCaseDocumentAsset[] = [];
    try {
      await session.withTransaction(async () => {
        const existingCase = await getCaseBySerialIdOrThrow(caseId, session);
        const caseDocuments = await documentRepository.findByCaseId(
          existingCase._id,
          { session },
        );
        documentAssetsToCleanup = caseDocuments.map((document) => ({
          _id: document._id.toString(),
          cloudinaryPublicId: document.cloudinaryPublicId,
          fileName: document.fileName,
          storageKey: document.storageKey,
        }));

        await documentRepository.deleteMany({ caseId: existingCase._id }, { session });
        await anesthesiaFormRepository.deleteMany({ caseId: existingCase._id }, { session });
        await patientMedicineRepository.deleteMany({ caseId: existingCase._id }, { session });
        await caseRepository.deleteById(existingCase._id, { session });

        if (existingCase.masterCaseId) {
          await masterCaseRepository.removeCaseId(
            existingCase.masterCaseId,
            existingCase._id,
            { session },
          );

          const masterCase = await masterCaseRepository.findById(
            existingCase.masterCaseId,
            { session },
          );
          if (masterCase && masterCase.caseIds.length === 0) {
            await masterCaseRepository.deleteById(masterCase._id, { session });
          }
        }

        await auditRepository.log(
          AUDIT_SUBJECT_PATIENT,
          "Case deleted",
          ENTITY_TYPE_CASE,
          existingCase._id.toString(),
          userId,
          session,
        );

        logger.info("Case deleted", {
          module: MODULE,
          event: "patient_case_deleted",
          user_id: userId,
          case_id: existingCase._id.toString(),
        });
      });
    } finally {
      await session.endSession();
    }

    await Promise.all(
      documentAssetsToCleanup.map(async (document) => {
        try {
          await deleteCaseDocumentAsset(document);
        } catch (cleanupError) {
          logger.warn("Case document asset cleanup failed after delete", {
            module: MODULE,
            event: "patient_case_document_asset_cleanup_failed",
            case_serial_id: caseId,
            doc_id: document._id,
            file_name: document.fileName,
            error: cleanupError,
          });
        }
      }),
    );
  }

  async getCaseDocuments(
    caseId: string,
  ): Promise<PatientDocumentResponseDTO[]> {
    await getCaseByIdOrThrow(caseId);
    const docs = await documentRepository.findByCaseId(caseId);
    return docs.map((d) => toPatientDocumentResponseDTO(d.toObject()));
  }

  async uploadDocument(
    dto: UploadDocumentDTO,
    buffer: Buffer,
    fileName: string,
    userId: string,
  ): Promise<PatientDocumentResponseDTO> {
    const existingCase = await getCaseByIdOrThrow(dto.caseId);
    if (existingCase.patientId.toString() !== dto.patientId) {
      throw new BadRequestError("Case does not belong to patient");
    }

    const uploadedAsset = await uploadToCloudinary({
      buffer,
      originalName: fileName,
      folder: PATIENT_STORAGE.DOCUMENTS_FOLDER,
      fallbackBaseName: PATIENT_STORAGE.DEFAULT_DOCUMENT_FILE_NAME,
    });
    const docData = mapUploadDocumentToData(
      dto,
      uploadedAsset.secureUrl,
      uploadedAsset.publicId,
      fileName,
      userId,
      existingCase._id,
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
        event: "patient_document_upload_audit_failed",
        user_id: userId,
        patient_id: dto.patientId,
        error: auditError,
      });
    }

    logger.info("Document uploaded", {
      module: MODULE,
      event: "patient_document_uploaded",
      user_id: userId,
      doc_id: doc._id.toString(),
      case_id: dto.caseId,
      patient_id: dto.patientId,
    });

    return toPatientDocumentResponseDTO(doc.toObject());
  }

  async uploadPatientPhoto(
    patientId: string,
    buffer: Buffer,
    originalName: string,
    userId: string,
  ): Promise<string> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError("Patient not found");
    }

    const uploadedAsset = await uploadToCloudinary({
      buffer,
      originalName,
      folder: PATIENT_STORAGE.PHOTOS_FOLDER,
      fallbackBaseName: PATIENT_STORAGE.DEFAULT_PHOTO_FILE_NAME,
    });

    const previousPhotoUrl = patient.photoName;
    const previousPhotoPublicId = patient.photoPublicId;
    await patientRepository.updateById(patient._id, {
      $set: {
        photoName: uploadedAsset.secureUrl,
        photoPublicId: uploadedAsset.publicId,
      },
    });

    if (previousPhotoUrl && previousPhotoUrl.startsWith("http")) {
      await deleteFromCloudinary(
        previousPhotoPublicId ?? previousPhotoUrl,
      ).catch((deleteError: unknown) => {
        logger.warn("Previous patient photo delete from Cloudinary failed", {
          module: MODULE,
          event: "patient_photo_previous_delete_failed",
          patient_id: patient._id.toString(),
          previous_photo_url: previousPhotoUrl,
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
        event: "patient_photo_audit_failed",
        user_id: userId,
        patient_id: patient._id.toString(),
        error: auditError,
      });
    }

    logger.info("Patient photo updated", {
      module: MODULE,
      event: "patient_photo_updated",
      user_id: userId,
      patient_id: patient._id.toString(),
    });

    return (
      toPatientPhotoUrl(
        patient._id.toString(),
        uploadedAsset.secureUrl,
        new Date(),
      ) ??
      uploadedAsset.secureUrl
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

    if (storageKey.startsWith("http")) {
      throw new BadRequestError("Patient photo is hosted externally");
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

    if (doc.storageKey.startsWith("http")) {
      await deleteFromCloudinary(doc.cloudinaryPublicId ?? doc.storageKey);
    } else {
      await storageService.delete(doc.storageKey);
    }
    await documentRepository.deleteById(documentId);

    await auditRepository.log(
      AUDIT_SUBJECT_PATIENT,
      `Document deleted: ${doc.fileName}`,
      ENTITY_TYPE_PATIENT,
      doc.patientId.toString(),
      userId,
    );

    logger.info("Document deleted", {
      module: MODULE,
      event: "patient_document_deleted",
      user_id: userId,
      doc_id: documentId,
      patient_id: doc.patientId.toString(),
    });
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
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        await getCaseByIdOrThrow(caseId, session);
        const { caseId: _dtoCaseId, ...formFields } = data;
        const formData: AnesthesiaFormUpsertData = {
          ...formFields,
          updatedByUserId: toObjectId(userId),
        };
        const form = await anesthesiaFormRepository.upsertByCaseId(
          caseId,
          formData,
          session,
        );

        await auditRepository.log(
          AUDIT_SUBJECT_PATIENT,
          "Anesthesia form updated",
          ENTITY_TYPE_CASE,
          caseId,
          userId,
          session,
        );

        logger.info("Anesthesia form upserted", {
          module: MODULE,
          event: "patient_anesthesia_form_upserted",
          user_id: userId,
          case_id: caseId,
        });

        return toAnesthesiaFormDTO(form.toObject());
      });
    } finally {
      await session.endSession();
    }
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

  async getCalendarMonth(
    year: number,
    month: number,
  ): Promise<CalendarMonthResponseDTO> {
    const { queryStart, queryEnd } = getCalendarQueryBounds(year, month);
    const cases = await caseRepository.findManyLean(
      {
        isDeleted: false,
        $or: [
          { "dates.procedureDate": { $gte: queryStart, $lt: queryEnd } },
          { "caseDetailsGrid.dateTime": { $gte: queryStart, $lt: queryEnd } },
        ],
      },
      {
        sort: {
          "dates.procedureDate": 1,
          serialId: 1,
        },
        select:
          "_id serialId masterCaseId flags dates.procedureDate caseDetailsGrid.date caseDetailsGrid.dateTime patientId",
        populate: ["patientId"],
      },
    );

    return buildCalendarMonthResponse(cases as CalendarCaseSource[], year, month);
  }

  async getDailyPlan(): Promise<DailyPlanDetailDTO[]> {
    const cases = await caseRepository.findMany(
      { isDeleted: false, isArchived: false },
      {
        sort: { createdAt: -1 },
        populate: [
          "patientId",
          "caseDetailsGrid.examinations.typeId",
          "caseDetailsGrid.procedures.typeId",
        ],
      },
    );
    return cases
      .map((caseDoc) => mapCaseToDailyPlanDetail(caseDoc.toObject()))
      .sort((left, right) => {
        const masterCaseCompare = left.master_case_id.localeCompare(
          right.master_case_id,
          undefined,
          { numeric: true },
        );

        if (masterCaseCompare !== 0) {
          return masterCaseCompare;
        }

        return left.serial_id.localeCompare(right.serial_id, undefined, {
          numeric: true,
        });
      });
  }

  async updateDailyPlan(payload: UpdateDailyPlanRequestDTO): Promise<void> {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const updates = Object.entries(payload);

        await Promise.all(
          updates.map(async ([caseId, update]) => {
            const targetCase =
              /^[a-fA-F0-9]{24}$/.test(caseId)
                ? await getCaseByIdOrThrow(caseId, session)
                : update.caseId
                  ? await getCaseBySerialIdOrThrow(update.caseId, session)
                  : await getCaseByIdOrThrow(caseId, session);

            const comments = update.comment ?? update.comments ?? "";
            await caseRepository.updateById(
              targetCase._id,
              {
                $set: {
                  dailyPlan: {
                    comments,
                    updatedAt: new Date(),
                  },
                },
              },
              { session },
            );
          }),
        );
      });
    } finally {
      await session.endSession();
    }
  }
}

export const patientService = new PatientService();
