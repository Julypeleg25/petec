import {
  ROUTES,
  SORT_DIRECTIONS,
  SYSTEM_TYPE_NAMES,
  SYSTEM_TYPE_NAMES_VALUES,
} from "@petec/shared";
import { jest } from "@jest/globals";
import { Types } from "mongoose";

const auditFindManyLeanMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const auditCountDocumentsMock = jest.fn<(...args: any[]) => Promise<number>>();
const caseFindManyLeanMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const caseCountDocumentsMock = jest.fn<(...args: any[]) => Promise<number>>();
const mapUserToRowMock = jest.fn<(value: any) => any>();
const buildAuditLogsFilterMock = jest.fn<(...args: any[]) => Promise<any>>();
const buildCasesFilterMock = jest.fn<(...args: any[]) => Promise<any>>();
const buildUsersFilterMock = jest.fn<(...args: any[]) => Promise<any>>();
const createMongoHandlerMock = jest.fn<(...args: any[]) => any>();
const createSystemTypeHandlerMock = jest.fn<(...args: any[]) => any>();
const toSkipMock = jest.fn<(page: number, limit: number) => number>();
const toSortRecordMock = jest.fn<(sortBy: string, sortOrder: string) => any>();
const toCreatedByNameMock = jest.fn<(value: any) => string>();
let userRowMapper: ((value: any) => any) | undefined;
const systemHandlerByType = new Map<string, unknown>();

const usersHandler = {
  find: jest.fn<(...args: any[]) => Promise<any[]>>(),
  count: jest.fn<(...args: any[]) => Promise<number>>(),
};

createMongoHandlerMock.mockImplementation((...args: any[]) => {
  userRowMapper = args[2];
  return usersHandler;
});
createSystemTypeHandlerMock.mockImplementation((typeName: string) => {
  const handler = { typeName };
  systemHandlerByType.set(typeName, handler);
  return handler;
});

jest.unstable_mockModule("../../../src/repositories/audit/index.js", () => ({
  auditRepository: {
    findManyLean: auditFindManyLeanMock,
    countDocuments: auditCountDocumentsMock,
  },
}));

jest.unstable_mockModule("../../../src/repositories/patient/index.js", () => ({
  caseRepository: {
    findManyLean: caseFindManyLeanMock,
    countDocuments: caseCountDocumentsMock,
  },
}));

jest.unstable_mockModule("../../../src/repositories/user/index.js", () => ({
  userRepository: {},
}));

jest.unstable_mockModule("../../../src/mappers/user/user.mappers.js", () => ({
  mapUserToRow: mapUserToRowMock,
}));

jest.unstable_mockModule("../../../src/mappers/table/table.mappers.utils.js", () => ({
  buildAuditLogsFilter: buildAuditLogsFilterMock,
  buildCasesFilter: buildCasesFilterMock,
  buildUsersFilter: buildUsersFilterMock,
  createMongoHandler: createMongoHandlerMock,
  createSystemTypeHandler: createSystemTypeHandlerMock,
  toSkip: toSkipMock,
  toSortRecord: toSortRecordMock,
  toCreatedByName: toCreatedByNameMock,
}));

const { TABLE_HANDLERS, mapCaseToPatientCardRowDTO } = await import(
  "../../../src/mappers/table/table.mappers.js"
);

describe("table.mappers", () => {
  beforeEach(() => {
    auditFindManyLeanMock.mockReset();
    auditCountDocumentsMock.mockReset();
    caseFindManyLeanMock.mockReset();
    caseCountDocumentsMock.mockReset();
    mapUserToRowMock.mockReset();
    buildAuditLogsFilterMock.mockReset();
    buildCasesFilterMock.mockReset();
    buildUsersFilterMock.mockReset();
    toSkipMock.mockReset();
    toSortRecordMock.mockReset();
    toCreatedByNameMock.mockReset();
    usersHandler.find.mockReset();
    usersHandler.count.mockReset();
  });

  it("maps patient card rows from case documents", () => {
    const patientId = new Types.ObjectId();
    const updatedAt = new Date("2026-04-21T12:00:00.000Z");

    expect(
      mapCaseToPatientCardRowDTO({
        _id: new Types.ObjectId(),
        serialId: "123-45",
        masterCaseId: new Types.ObjectId(),
        patientId: {
          _id: patientId,
          name: "Milo",
          owner: {
            name: "Dana",
            phone: "0501234567",
          },
          photoName: "avatar.png",
          updatedAt,
        },
        admission: {
          hospitalizationReason: "Observation",
        },
        flags: {
          isAggressive: true,
          isEscapePotential: false,
          isAllergic: true,
          isRiskAnesthesia: false,
          isHeartMurmur: true,
          isAMB: false,
        },
        numOfAlerts: 3,
      } as never),
    ).toEqual({
      _id: expect.any(String),
      serialId: "123-45",
      masterCaseId: expect.any(String),
      patientId: {
        name: "Milo",
        owner: {
          name: "Dana",
          phone: "0501234567",
        },
        photoName: `${ROUTES.PATIENT}/photo/${patientId.toString()}?v=${updatedAt.getTime()}`,
      },
      admission: {
        hospitalizationReason: "Observation",
      },
      flags: {
        isAggressive: true,
        isEscapePotential: false,
        isAllergic: true,
        isRiskAnesthesia: false,
        isHeartMurmur: true,
        isAMB: false,
      },
      numOfAlerts: 3,
    });
  });

  it("finds and counts patient card rows for patient tables", async () => {
    const filter = { isDeleted: false };
    buildCasesFilterMock.mockResolvedValue(filter);
    toSkipMock.mockReturnValue(20);
    toSortRecordMock.mockReturnValue({ serialId: 1 });
    caseFindManyLeanMock.mockResolvedValue([
      {
        _id: new Types.ObjectId(),
        serialId: "123-45",
        patientId: {
          name: "Milo",
        },
      },
    ]);
    caseCountDocumentsMock.mockResolvedValue(12);

    await expect(
      TABLE_HANDLERS.patients.find(
        { active: true },
        { page: 3, limit: 10, sortBy: "serialId", sortOrder: "asc" },
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        serialId: "123-45",
      }),
    ]);

    await expect(TABLE_HANDLERS.patients.count({ active: true })).resolves.toBe(12);

    expect(buildCasesFilterMock).toHaveBeenNthCalledWith(
      1,
      { active: true },
      { isProcedure: false },
    );
    expect(caseFindManyLeanMock).toHaveBeenCalledWith(filter, {
      skip: 20,
      limit: 10,
      sort: { serialId: 1 },
      populate: ["patientId"],
    });
    expect(buildCasesFilterMock).toHaveBeenNthCalledWith(
      2,
      { active: true },
      { isProcedure: false },
    );
    expect(caseCountDocumentsMock).toHaveBeenCalledWith(filter);
  });

  it("finds and counts patient card rows for procedure cases", async () => {
    const filter = { isArchived: false };
    buildCasesFilterMock.mockResolvedValue(filter);
    toSkipMock.mockReturnValue(0);
    toSortRecordMock.mockReturnValue({ createdAt: -1 });
    caseFindManyLeanMock.mockResolvedValue([]);
    caseCountDocumentsMock.mockResolvedValue(4);

    await expect(
      TABLE_HANDLERS.cases.find(
        { procedureDateIsToday: true },
        { page: 1, limit: 25, sortBy: "createdAt", sortOrder: "desc" },
      ),
    ).resolves.toEqual([]);

    await expect(
      TABLE_HANDLERS.cases.count({ procedureDateIsToday: true }),
    ).resolves.toBe(4);

    expect(buildCasesFilterMock).toHaveBeenNthCalledWith(
      1,
      { procedureDateIsToday: true },
      { isProcedure: true },
    );
    expect(buildCasesFilterMock).toHaveBeenNthCalledWith(
      2,
      { procedureDateIsToday: true },
      { isProcedure: true },
    );
  });

  it("maps audit logs and resolves case serial ids when present", async () => {
    const caseId = new Types.ObjectId().toString();
    const filter = { subject: "Patient" };

    buildAuditLogsFilterMock.mockResolvedValue(filter);
    toSkipMock.mockReturnValue(5);
    toSortRecordMock.mockReturnValue({ createdAt: SORT_DIRECTIONS.DESC });
    toCreatedByNameMock
      .mockReturnValueOnce("Dana User")
      .mockReturnValueOnce("System");
    toCreatedByNameMock.mockReturnValueOnce("System");
    auditFindManyLeanMock.mockResolvedValue([
      {
        _id: new Types.ObjectId(),
        entityType: "Case",
        entityId: caseId,
        subject: "Patient",
        description: "Updated case",
        createdAt: "2026-04-21T10:00:00.000Z",
        performedByUserId: { firstName: "Dana" },
      },
      {
        _id: new Types.ObjectId(),
        entityType: "Patient",
        entityId: "patient-1",
        subject: "Patient",
        description: "Updated patient",
        createdAt: "2026-04-21T11:00:00.000Z",
        performedByUserId: null,
      },
      {
        _id: new Types.ObjectId(),
        entityType: "Case",
        entityId: "not-an-object-id",
        subject: "Ignored case lookup",
        description: "No serial lookup",
        createdAt: undefined,
        performedByUserId: null,
      },
    ]);
    caseFindManyLeanMock.mockResolvedValue([
      {
        _id: caseId,
        serialId: "123-45",
      },
    ]);
    auditCountDocumentsMock.mockResolvedValue(3);

    await expect(
      TABLE_HANDLERS.auditLogs.find(
        { subject: "Patient" },
        { page: 2, limit: 5, sortBy: "createdAt", sortOrder: "desc" },
      ),
    ).resolves.toEqual([
      {
        id: expect.any(String),
        subject: "Patient",
        description: "Updated case",
        created_at: "2026-04-21T10:00:00.000Z",
        created_by_name: "Dana User",
        case_id: caseId,
        case_serial_id: "123-45",
        patient_name: "",
      },
      {
        id: expect.any(String),
        subject: "Patient",
        description: "Updated patient",
        created_at: "2026-04-21T11:00:00.000Z",
        created_by_name: "System",
        case_id: "",
        case_serial_id: "",
        patient_name: "",
      },
      {
        id: expect.any(String),
        subject: "Ignored case lookup",
        description: "No serial lookup",
        created_at: "",
        created_by_name: "System",
        case_id: "not-an-object-id",
        case_serial_id: "",
        patient_name: "",
      },
    ]);

    await expect(TABLE_HANDLERS.auditLogs.count({ subject: "Patient" })).resolves.toBe(
      3,
    );

    expect(buildAuditLogsFilterMock).toHaveBeenNthCalledWith(1, {
      subject: "Patient",
    });
    expect(auditFindManyLeanMock).toHaveBeenCalledWith(filter, {
      skip: 5,
      limit: 5,
      sort: { createdAt: SORT_DIRECTIONS.DESC },
      populate: "performedByUserId",
    });
    expect(caseFindManyLeanMock).toHaveBeenCalledWith(
      { _id: { $in: [new Types.ObjectId(caseId)] } },
      {
        select: "_id serialId",
        skip: 0,
        limit: 1,
        sort: { _id: SORT_DIRECTIONS.ASC },
      },
    );
    expect(buildAuditLogsFilterMock).toHaveBeenNthCalledWith(2, {
      subject: "Patient",
    });
    expect(auditCountDocumentsMock).toHaveBeenCalledWith(filter);
  });

  it("wires user and system handlers during module creation", () => {
    mapUserToRowMock.mockReturnValue({
      id: "user-1",
      username: "dana",
      first_name: "Dana",
      last_name: "Cohen",
      email: "dana@example.com",
      role: "admin",
      role_name: "Admin",
      status: "active",
      lastLogin: null,
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-21T00:00:00.000Z",
    });

    expect(userRowMapper).toEqual(expect.any(Function));
    expect(userRowMapper?.({ _id: "user-1" })).toEqual({
      id: "user-1",
      username: "dana",
      first_name: "Dana",
      last_name: "Cohen",
      email: "dana@example.com",
      role: "admin",
      role_name: "Admin",
      status: "active",
      lastLogin: "",
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-21T00:00:00.000Z",
    });

    expect(TABLE_HANDLERS.users).toBe(usersHandler);
    expect(systemHandlerByType.size).toBe(SYSTEM_TYPE_NAMES_VALUES.length);
    expect(TABLE_HANDLERS[SYSTEM_TYPE_NAMES.MEDICINES]).toEqual(
      systemHandlerByType.get(SYSTEM_TYPE_NAMES.MEDICINES),
    );
  });
});
