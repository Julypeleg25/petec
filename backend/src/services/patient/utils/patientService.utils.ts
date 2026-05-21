import { logger } from "../../../config/logger.js";
import { NotFoundError } from "../../../constants/error.constants.js";
import { caseRepository } from "../../../repositories/patient/index.js";
import { masterCaseRepository } from "../../../repositories/patient/index.js";
import { patientRepository } from "../../../repositories/patient/index.js";
import { storageService } from "../../storage/index.js";
import { deleteFromCloudinary } from "../../../utils/cloudinary.utils.js";
import { toDateInputString } from "../../../mappers/common/common.mappers.utils.js";
import { getCaseSerialPrefix } from "@petec/shared";
import type { ClientSession } from "mongoose";
import type { CaseDocument, ICase } from "../../../models/case/index.js";

const MODULE = "patient";
const CALENDAR_QUERY_BUFFER_DAYS = 1;

const getOrThrow = async <T>(
  finder: () => Promise<T | null>,
  label: string,
): Promise<T> => {
  const doc = await finder();
  if (!doc) throw new NotFoundError(`${label} not found`);
  return doc;
};

export const getCaseByIdOrThrow = (caseId: string, session?: ClientSession): Promise<CaseDocument> =>
  getOrThrow(() => caseRepository.findById(caseId, { session }), "Case");

export const getCaseByIdPopulatedOrThrow = (caseId: string): Promise<CaseDocument> =>
  getOrThrow(() => caseRepository.findByIdPopulated(caseId), "Case");

export const getCaseBySerialIdOrThrow = (caseId: string, session?: ClientSession): Promise<CaseDocument> =>
  getOrThrow(() => caseRepository.findBySerialId(caseId, { session }), "Case");

export const ensureDedicatedPatientForCase = async (
  caseDoc: CaseDocument,
  session?: ClientSession,
): Promise<ICase["patientId"]> => {
  const linkedCases = await caseRepository.findByPatientId(caseDoc.patientId, { session });
  if (linkedCases.length <= 1) {
    return caseDoc.patientId;
  }

  const sourcePatient = await patientRepository.findById(caseDoc.patientId, { session });
  if (!sourcePatient) {
    throw new NotFoundError("Patient not found");
  }

  const isolatedPatient = await patientRepository.create({
    serialId: caseDoc.serialId,
    name: sourcePatient.name,
    owner: { ...sourcePatient.owner },
    photoName: sourcePatient.photoName,
    refs: sourcePatient.refs,
  }, { session });

  await caseRepository.updateById(caseDoc._id, {
    $set: { patientId: isolatedPatient._id },
  }, { session });
  caseDoc.patientId = isolatedPatient._id;

  logger.info("Case patient isolated", {
    module: MODULE,
    case_id: caseDoc._id.toString(),
    previous_patient_id: sourcePatient._id.toString(),
    patient_id: isolatedPatient._id.toString(),
  });

  return isolatedPatient._id;
};

export const resolveMasterCaseBySerialPrefix = async (
  caseSerialId: string,
  session?: ClientSession,
): Promise<NonNullable<ICase["masterCaseId"]> | null> => {
  const serialPrefix = getCaseSerialPrefix(caseSerialId);
  if (!serialPrefix) {
    return null;
  }

  const casesWithSamePrefix = await caseRepository.findBySerialPrefix(
    serialPrefix,
    { session },
  );
  if (casesWithSamePrefix.length === 0) {
    return null;
  }

  const existingMasterCaseId = casesWithSamePrefix
    .map((row) => row.masterCaseId)
    .find((id): id is NonNullable<ICase["masterCaseId"]> => Boolean(id));

  if (existingMasterCaseId) {
    await caseRepository.assignMasterCaseBySerialPrefix(
      serialPrefix,
      existingMasterCaseId,
      { session },
    );
    await Promise.all(
      casesWithSamePrefix.map((row) =>
        masterCaseRepository.addCaseId(existingMasterCaseId, row._id, { session }),
      ),
    );
    return existingMasterCaseId;
  }

  const createdMasterCase = await masterCaseRepository.create(
    { caseIds: casesWithSamePrefix.map((row) => row._id) },
    { session },
  );

  await caseRepository.assignMasterCaseBySerialPrefix(
    serialPrefix,
    createdMasterCase._id,
    { session },
  );

  return createdMasterCase._id;
};

export const getTodayProcedureDateFilter = (): { $gte: Date; $lt: Date } | null => {
  const todayKey = toDateInputString(new Date());
  const dayMatch = todayKey
    ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(todayKey)
    : null;

  if (!dayMatch) {
    return null;
  }

  const year = Number(dayMatch[1]);
  const month = Number(dayMatch[2]);
  const day = Number(dayMatch[3]);
  const start = new Date(Date.UTC(year, month - 1, day));

  if (
    start.getUTCFullYear() !== year ||
    start.getUTCMonth() !== month - 1 ||
    start.getUTCDate() !== day
  ) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { $gte: start, $lt: end };
};

export const shouldPersistManualProcedureUnarchive = (
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

export const getCalendarQueryBounds = (
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

export type DeletedCaseDocumentAsset = {
  _id: string;
  cloudinaryPublicId?: string;
  fileName: string;
  storageKey: string;
};

export const deleteCaseDocumentAsset = async (
  document: DeletedCaseDocumentAsset,
): Promise<void> => {
  if (document.storageKey.startsWith("http")) {
    await deleteFromCloudinary(document.cloudinaryPublicId ?? document.storageKey);
    return;
  }

  await storageService.delete(document.storageKey);
};
