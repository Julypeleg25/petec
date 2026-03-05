import { logger } from "@config/logger";
import { NotFoundError } from "@constants/error.constants";
import { caseRepository } from "@repositories/case.repository";
import { masterCaseRepository } from "@repositories/masterCase.repository";
import { patientRepository } from "@repositories/patient.repository";
import { getCaseSerialPrefix } from "@petec/shared";
import type { CaseDocument, ICase } from "@models/Case";

const MODULE = "patient";

// IMPORTANT: Public case identifiers are legacy serialId strings.
// Any "caseId" coming from APIs is a case serialId (NOT Mongo _id).
export const getCaseByIdOrThrow = async (
  caseSerialId: string,
): Promise<CaseDocument> => {
  const caseDoc = await caseRepository.findBySerialId(caseSerialId);
  if (!caseDoc) {
    throw new NotFoundError("Case not found");
  }
  return caseDoc;
};

export const getCaseByIdPopulatedOrThrow = async (
  caseSerialId: string,
): Promise<CaseDocument> => {
  const caseDoc = await caseRepository.findBySerialIdPopulated(caseSerialId);
  if (!caseDoc) {
    throw new NotFoundError("Case not found");
  }
  return caseDoc;
};

export const getCaseBySerialIdOrThrow = async (
  caseSerialId: string,
): Promise<CaseDocument> => {
  const caseDoc = await caseRepository.findBySerialId(caseSerialId);
  if (!caseDoc) {
    throw new NotFoundError("Case not found");
  }
  return caseDoc;
};

export const ensureDedicatedPatientForCase = async (
  caseDoc: CaseDocument,
): Promise<ICase["patientId"]> => {
  const linkedCases = await caseRepository.findByPatientId(caseDoc.patientId);
  if (linkedCases.length <= 1) {
    return caseDoc.patientId;
  }

  const sourcePatient = await patientRepository.findById(caseDoc.patientId);
  if (!sourcePatient) {
    throw new NotFoundError("Patient not found");
  }

  const isolatedPatient = await patientRepository.create({
    serialId: caseDoc.serialId,
    name: sourcePatient.name,
    owner: { ...sourcePatient.owner },
    photoName: sourcePatient.photoName,
    refs: sourcePatient.refs,
  });

  await caseRepository.updateById(caseDoc._id, {
    $set: { patientId: isolatedPatient._id },
  });
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
): Promise<NonNullable<ICase["masterCaseId"]> | null> => {
  const serialPrefix = getCaseSerialPrefix(caseSerialId);
  if (!serialPrefix) {
    return null;
  }

  const casesWithSamePrefix = await caseRepository.findBySerialPrefix(
    serialPrefix,
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
    );
    await Promise.all(
      casesWithSamePrefix.map((row) =>
        masterCaseRepository.addCaseId(existingMasterCaseId, row._id),
      ),
    );
    return existingMasterCaseId;
  }

  const createdMasterCase = await masterCaseRepository.create({
    caseIds: casesWithSamePrefix.map((row) => row._id),
  });

  await caseRepository.assignMasterCaseBySerialPrefix(
    serialPrefix,
    createdMasterCase._id,
  );

  return createdMasterCase._id;
};
