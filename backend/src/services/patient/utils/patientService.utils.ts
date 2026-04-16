import { logger } from "../../../config/logger.js";
import { NotFoundError } from "../../../constants/error.constants.js";
import { caseRepository } from "../../../repositories/patient/index.js";
import { masterCaseRepository } from "../../../repositories/patient/index.js";
import { patientRepository } from "../../../repositories/patient/index.js";
import { getCaseSerialPrefix } from "@petec/shared";
import type { ClientSession } from "mongoose";
import type { CaseDocument, ICase } from "../../../models/case/index.js";

const MODULE = "patient";

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
