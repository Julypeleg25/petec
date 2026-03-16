import { SORT_DIRECTIONS, SYSTEM_TYPE_NAMES_VALUES } from "@petec/shared";
import { Types } from "mongoose";

import { auditRepository } from "@repositories/audit";
import { caseRepository } from "@repositories/patient";
import { userRepository } from "@repositories/user";
import { mapUserToRow } from "@mappers/user/user.mappers";
import {
  buildAuditLogsFilter,
  buildCasesFilter,
  buildUsersFilter,
  createMongoHandler,
  createSystemTypeHandler,
  toSkip,
  toSortRecord,
  toCreatedByName,
  type AuditLogLean,
} from "@mappers/table/table.mappers.utils";

import type { MongoFilter } from "@app-types/global.types";
import { toPatientPhotoUrl } from "@utils/patientPhoto.utils";
import type {
  BaseTableKey,
  CollectionHandler,
  PaginationArgs,
  TableKey,
  TableRow,
} from "@mappers/table/table.mappers.types";
import type { IPatient } from "@models/patient";
import type { ICase } from "@models/case";

export type PatientCardCaseTableDoc = Pick<
  ICase,
  | "_id"
  | "serialId"
  | "masterCaseId"
  | "admission"
  | "flags"
  | "dates"
  | "refs"
  | "caseDetailsGrid"
> & { numOfAlerts?: number; patientId?: Partial<IPatient> };

export const mapCaseToPatientCardRowDTO = (
  doc: PatientCardCaseTableDoc,
) => {
  const patient = doc.patientId || {};
  const patientRefId =
    patient._id instanceof Types.ObjectId
      ? patient._id.toString()
      : typeof patient._id === "string"
        ? patient._id
        : undefined;
  const patientName = typeof patient.name === "string" ? patient.name : "";
  const ownerName =
    typeof patient.owner?.name === "string" ? patient.owner.name : "";
  const ownerPhone =
    typeof patient.owner?.phone === "string" ? patient.owner.phone : "";
  const hospitalizationReason =
    typeof doc.admission?.hospitalizationReason === "string"
      ? doc.admission.hospitalizationReason
      : undefined;
  const numOfAlerts =
    typeof doc.numOfAlerts === "number" && Number.isFinite(doc.numOfAlerts)
      ? doc.numOfAlerts
      : 0;
  const photoName = toPatientPhotoUrl(
    patientRefId,
    typeof patient.photoName === "string" ? patient.photoName : undefined,
    patient.updatedAt,
  ) ?? undefined;
  return {
    _id: doc._id?.toString() || "",
    serialId: typeof doc.serialId === "string" ? doc.serialId : "",
    masterCaseId: doc.masterCaseId?.toString(),
    patientId: {
      name: patientName,
      owner: {
        name: ownerName,
        phone: ownerPhone,
      },
      photoName,
    },
    admission: {
      hospitalizationReason,
    },
    flags: {
      isAggressive: doc.flags?.isAggressive === true,
      isEscapePotential: doc.flags?.isEscapePotential === true,
      isAllergic: doc.flags?.isAllergic === true,
      isRiskAnesthesia: doc.flags?.isRiskAnesthesia === true,
      isHeartMurmur: doc.flags?.isHeartMurmur === true,
      isAMB: doc.flags?.isAMB === true,
    },
    numOfAlerts,
  };
};

const mapAuditLogsToRows = async (
  docs: ReadonlyArray<AuditLogLean>,
): Promise<ReadonlyArray<TableRow>> => {
  const caseEntityIds = [
    ...new Set(
      docs
        .filter(
          (doc) =>
            doc.entityType === "Case" &&
            typeof doc.entityId === "string" &&
            Types.ObjectId.isValid(doc.entityId),
        )
        .map((doc) => doc.entityId as string),
    ),
  ];

  const caseSerialIdMap = new Map<string, string>();
  if (caseEntityIds.length > 0) {
    const matchedCases = await caseRepository.findManyLean(
      { _id: { $in: caseEntityIds.map((id) => new Types.ObjectId(id)) } },
      {
        select: "_id serialId",
        skip: 0,
        limit: caseEntityIds.length,
        sort: { _id: SORT_DIRECTIONS.ASC },
      },
    );

    for (const matchedCase of matchedCases) {
      caseSerialIdMap.set(matchedCase._id.toString(), matchedCase.serialId);
    }
  }

  return docs.map((doc) => {
    const caseId =
      doc.entityType === "Case" && typeof doc.entityId === "string"
        ? doc.entityId
        : "";
    const caseSerialId = caseId ? (caseSerialIdMap.get(caseId) ?? "") : "";

    return {
      id: doc._id?.toString() || "",
      subject: doc.subject ?? "",
      description: doc.description ?? "",
      created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : "",
      created_by_name: toCreatedByName(doc.performedByUserId),
      case_id: caseId,
      case_serial_id: caseSerialId,
      patient_name: "",
    };
  });
};

type UserTableMapperInput = Parameters<typeof mapUserToRow>[0];

const mapUserToTableRow = (user: UserTableMapperInput): TableRow => {
  const row = mapUserToRow(user);
  return {
    id: row.id,
    username: row.username,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    role: row.role,
    role_name: row.role_name,
    status: row.status,
    lastLogin: row.lastLogin ?? "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const BASE_HANDLERS: Record<BaseTableKey, CollectionHandler<TableRow>> = {
  patients: {
    async find(filter: MongoFilter, args: PaginationArgs) {
      const { page, limit, sortBy, sortOrder } = args;
      const docs = await caseRepository.findManyLean(
        await buildCasesFilter(filter, { isProcedure: false }),
        {
          skip: toSkip(page, limit),
          limit,
          sort: toSortRecord(sortBy, sortOrder),
          populate: ["patientId"],
        },
      );
      return docs.map((doc) => mapCaseToPatientCardRowDTO(doc));
    },
    async count(filter: MongoFilter) {
      return caseRepository.countDocuments(
        await buildCasesFilter(filter, { isProcedure: false }),
      );
    },
  },
  cases: {
    async find(filter: MongoFilter, args: PaginationArgs) {
      const { page, limit, sortBy, sortOrder } = args;
      const docs = await caseRepository.findManyLean(
        await buildCasesFilter(filter, { isProcedure: true }),
        {
          skip: toSkip(page, limit),
          limit,
          sort: toSortRecord(sortBy, sortOrder),
          populate: ["patientId"],
        },
      );
      return docs.map((doc) => mapCaseToPatientCardRowDTO(doc));
    },
    async count(filter: MongoFilter) {
      return caseRepository.countDocuments(
        await buildCasesFilter(filter, { isProcedure: true }),
      );
    },
  },
  auditLogs: {
    async find(filter: MongoFilter, args: PaginationArgs) {
      const { page, limit, sortBy, sortOrder } = args;
      const mappedFilter = await buildAuditLogsFilter(filter);
      const docs = await auditRepository.findManyLean(mappedFilter, {
        skip: toSkip(page, limit),
        limit,
        sort: toSortRecord(sortBy, sortOrder),
        populate: "performedByUserId",
      });
      return mapAuditLogsToRows(docs as AuditLogLean[]);
    },
    async count(filter: MongoFilter) {
      return auditRepository.countDocuments(await buildAuditLogsFilter(filter));
    },
  },
  users: createMongoHandler(
    userRepository,
    buildUsersFilter,
    mapUserToTableRow,
  ) as CollectionHandler<TableRow>,
};

const SYSTEM_HANDLERS = Object.fromEntries(
  SYSTEM_TYPE_NAMES_VALUES.map((typeName) => [
    typeName,
    createSystemTypeHandler(typeName),
  ]),
) as Record<
  (typeof SYSTEM_TYPE_NAMES_VALUES)[number],
  CollectionHandler<TableRow>
>;

export const TABLE_HANDLERS: Readonly<
  Record<TableKey, CollectionHandler<TableRow>>
> = Object.freeze({
  ...BASE_HANDLERS,
  ...SYSTEM_HANDLERS,
});
