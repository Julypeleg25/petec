import {
  SORT_DIRECTIONS,
  SortOrders,
  SYSTEM_TYPE_NAMES,
  TABLE_SEARCH_FILTER_KEYS,
  TABLE_SORT_FIELDS,
} from "@petec/shared";
import { jest } from "@jest/globals";
import { Types } from "mongoose";

const patientRepositoryMocks = {
  searchCasePatientIds: jest.fn<(...args: any[]) => Promise<any[]>>(),
  searchByName: jest.fn<(...args: any[]) => Promise<any[]>>(),
  searchByOwnerPhone: jest.fn<(...args: any[]) => Promise<any[]>>(),
};

const caseRepositoryMocks = {
  findManyLean: jest.fn<(...args: any[]) => Promise<any[]>>(),
};

const systemTypesRepositoryMocks = {
  getModel: jest.fn<(...args: any[]) => any>(),
  findPaginated: jest.fn<(...args: any[]) => Promise<any[]>>(),
  countDocuments: jest.fn<(...args: any[]) => Promise<number>>(),
};

const userRepositoryMocks = {
  findManyLean: jest.fn<(...args: any[]) => Promise<any[]>>(),
};

const toAdminMedicineRowDTOMock = jest.fn<(value: any) => any>();

jest.unstable_mockModule("../../../src/repositories/patient/index.js", () => ({
  patientRepository: patientRepositoryMocks,
  caseRepository: caseRepositoryMocks,
}));

jest.unstable_mockModule("../../../src/repositories/admin/index.js", () => ({
  systemTypesRepository: systemTypesRepositoryMocks,
}));

jest.unstable_mockModule("../../../src/repositories/user/index.js", () => ({
  userRepository: userRepositoryMocks,
}));

jest.unstable_mockModule("../../../src/mappers/systemManagement/index.js", () => ({
  toAdminMedicineRowDTO: toAdminMedicineRowDTOMock,
}));

const {
  buildAuditLogsFilter,
  buildCasesFilter,
  buildPatientCardsFilter,
  buildUsersFilter,
  createMongoHandler,
  createSystemTypeHandler,
  escapeRegex,
  extractHasAlertsFilter,
  toBooleanFilterValue,
  toCreatedByName,
  toSearchRegex,
  toSkip,
  toSortRecord,
} = await import("../../../src/mappers/table/table.mappers.utils.js");

const createModelQuery = (results: any[]) => {
  const exec = jest.fn(async () => results);
  const lean = jest.fn(() => ({ exec }));
  const limit = jest.fn(() => ({ lean }));
  const select = jest.fn(() => ({ limit }));
  const find = jest.fn(() => ({ select }));

  return {
    model: { find },
    find,
    select,
    limit,
    lean,
    exec,
  };
};

describe("table.mappers.utils", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    for (const group of [
      patientRepositoryMocks,
      caseRepositoryMocks,
      systemTypesRepositoryMocks,
      userRepositoryMocks,
    ]) {
      for (const mockFn of Object.values(group)) {
        mockFn.mockReset();
      }
    }
    toAdminMedicineRowDTOMock.mockReset();
  });

  it("escapes regex input and resolves sort/skip/filter helpers", () => {
    expect(escapeRegex("a+b*c?")).toBe("a\\+b\\*c\\?");
    expect(toSearchRegex("   ").test("anything")).toBe(true);

    expect(toSortRecord("serial_id", SortOrders.ASC)).toEqual({
      serialId: SORT_DIRECTIONS.ASC,
      _id: SORT_DIRECTIONS.ASC,
    });
    expect(toSortRecord("id", SortOrders.DESC)).toEqual({
      _id: SORT_DIRECTIONS.DESC,
    });
    expect(toSortRecord("   ", SortOrders.ASC)).toEqual({
      createdAt: SORT_DIRECTIONS.ASC,
      _id: SORT_DIRECTIONS.ASC,
    });
    expect(toSkip(3, 10)).toBe(20);

    expect(toBooleanFilterValue(true)).toBe(true);
    expect(toBooleanFilterValue(" false ")).toBe(false);
    expect(toBooleanFilterValue("maybe")).toBeUndefined();
    expect(
      extractHasAlertsFilter({
        [TABLE_SEARCH_FILTER_KEYS.HAS_ALERTS]: "true",
      }),
    ).toBe(true);
    expect(
      extractHasAlertsFilter({
        [TABLE_SEARCH_FILTER_KEYS.HAS_ALERTS]: false,
      }),
    ).toBe(false);
  });

  it("builds user filters with mapped keys, date ranges, and raw non-string clauses", () => {
    const filter = buildUsersFilter({
      first_name: " Dana ",
      role_name: "admin",
      createdAt: "2026-04",
      active: true,
      blank: "   ",
    });

    expect(filter).toEqual({
      $and: [
        { isDeleted: { $ne: true } },
        { firstName: /Dana/i },
        { role: /admin/i },
        {
          createdAt: {
            $gte: new Date("2026-04-01T00:00:00.000Z"),
            $lt: new Date("2026-05-01T00:00:00.000Z"),
          },
        },
        { active: true },
      ],
    });
  });

  it("returns the default active-user clause when no usable user filters are provided", () => {
    expect(
      buildUsersFilter({
        first_name: "   ",
      }),
    ).toEqual({
      isDeleted: { $ne: true },
    });
  });

  it("falls back to regex date search when user date filters are invalid", () => {
    expect(
      buildUsersFilter({
        createdAt: "2026-02-30",
        updatedAt: "not-a-date",
      }),
    ).toEqual({
      $and: [
        { isDeleted: { $ne: true } },
        { createdAt: /2026-02-30/i },
        { updatedAt: /not-a-date/i },
      ],
    });
  });

  it("builds audit-log filters using case serial, user, patient, date, and text lookups", async () => {
    caseRepositoryMocks.findManyLean
      .mockResolvedValueOnce([{ _id: "case-1" }])
      .mockResolvedValueOnce([{ _id: "case-2" }]);
    userRepositoryMocks.findManyLean.mockResolvedValue([{ _id: "user-1" }]);
    patientRepositoryMocks.searchCasePatientIds.mockResolvedValue(["patient-1"]);

    const filter = await buildAuditLogsFilter({
      [TABLE_SORT_FIELDS.CREATED_AT]: "2026-04-21",
      [TABLE_SORT_FIELDS.CASE_SERIAL_ID]: "123-45",
      [TABLE_SORT_FIELDS.CREATED_BY_NAME]: "dana",
      [TABLE_SORT_FIELDS.PATIENT_NAME]: "milo",
      description: "edited",
    });

    expect(filter).toEqual({
      $and: [
        {
          createdAt: {
            $gte: new Date("2026-04-21T00:00:00.000Z"),
            $lt: new Date("2026-04-22T00:00:00.000Z"),
          },
        },
        { entityType: "Case" },
        { entityId: { $in: ["case-1"] } },
        { performedByUserId: { $in: ["user-1"] } },
        { entityType: "Case" },
        { entityId: { $in: ["case-2"] } },
        { description: /edited/i },
      ],
    });

    expect(caseRepositoryMocks.findManyLean).toHaveBeenNthCalledWith(
      1,
      { serialId: /123-45/i, isDeleted: false },
      { select: "_id", limit: 1000 },
    );
    expect(userRepositoryMocks.findManyLean).toHaveBeenCalledWith(
      {
        $or: [{ username: /dana/i }, { email: /dana/i }],
      },
      { select: "_id", limit: 1000 },
    );
    expect(patientRepositoryMocks.searchCasePatientIds).toHaveBeenCalledWith(
      "milo",
      1000,
    );
    expect(caseRepositoryMocks.findManyLean).toHaveBeenNthCalledWith(
      2,
      { patientId: { $in: ["patient-1"] }, isDeleted: false },
      { select: "_id", limit: 1000 },
    );
  });

  it("builds patient card filters from global search and strips utility keys", () => {
    const filter = buildPatientCardsFilter({
      [TABLE_SEARCH_FILTER_KEYS.SEARCH]: "050-12 34",
      [TABLE_SEARCH_FILTER_KEYS.HAS_ALERTS]: "true",
      status: "open",
    });

    expect(filter).toEqual({
      status: "open",
      $or: [
        { serialId: /(?=.*050-12)(?=.*34).*/i },
        { serialId: /0\D*5\D*0\D*1\D*2\D*3\D*4/i },
        { name: /(?=.*050-12)(?=.*34).*/i },
        { "owner.name": /(?=.*050-12)(?=.*34).*/i },
        { "owner.phone": /0\D*5\D*0\D*1\D*2\D*3\D*4/i },
      ],
    });
    expect((((filter as any).$or?.[4] as any)["owner.phone"]).test("050-1 2-34")).toBe(
      true,
    );
  });

  it("returns clean patient card filters when there is no search term", () => {
    expect(
      buildPatientCardsFilter({
        archived: false,
        [TABLE_SEARCH_FILTER_KEYS.HAS_ALERTS]: "true",
      }),
    ).toEqual({
      archived: false,
    });
  });

  it("falls back to general regex search for patient cards when no digits exist", () => {
    const filter = buildPatientCardsFilter({
      [TABLE_SEARCH_FILTER_KEYS.MASTER_CASE_ID]: "Alpha",
      status: "open",
    });

    expect(filter).toEqual({
      status: "open",
      $or: [
        { serialId: /Alpha/i },
        { name: /Alpha/i },
        { "owner.name": /Alpha/i },
        { "owner.phone": /Alpha/i },
      ],
    });
  });

  it("builds case filters for procedure-today tables with column-level patient intersections", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T12:00:00.000Z"));
    patientRepositoryMocks.searchByName.mockResolvedValue([
      { _id: "patient-1" },
      { _id: "patient-2" },
    ]);
    patientRepositoryMocks.searchByOwnerPhone.mockResolvedValue([
      { _id: "patient-2" },
      { _id: "patient-3" },
    ]);

    const filter = await buildCasesFilter(
      {
        [TABLE_SEARCH_FILTER_KEYS.PROCEDURE_DATE_IS_TODAY]: "true",
        [TABLE_SEARCH_FILTER_KEYS.HAS_ALERTS]: "true",
        serialId: "SER",
        "patientId.name": "Milo",
        "patientId.owner.phone": "050-12",
        isArchived: "true",
      },
      { isProcedure: true },
    );

    expect(filter).toEqual({
      $and: [
        {
          isDeleted: false,
          isArchived: true,
          "flags.isProcedure": true,
          serialId: /SER/i,
          patientId: { $in: ["patient-2"] },
        },
        {
          $or: [
            {
              "dates.procedureDate": {
                $gte: new Date("2026-04-21T00:00:00.000Z"),
                $lt: new Date("2026-04-22T00:00:00.000Z"),
              },
            },
            {
              "caseDetailsGrid.dateTime": {
                $gte: new Date("2026-04-21T00:00:00.000Z"),
                $lt: new Date("2026-04-22T00:00:00.000Z"),
              },
            },
            { isManuallyUnarchived: true },
          ],
        },
      ],
    });
  });

  it("builds case filters from search terms including masterCase object ids and patient matches", async () => {
    const objectIdString = new Types.ObjectId().toString();
    patientRepositoryMocks.searchCasePatientIds.mockResolvedValue(["patient-9"]);

    const filter = await buildCasesFilter(
      {
        [TABLE_SEARCH_FILTER_KEYS.SEARCH]: objectIdString,
      },
      { isProcedure: false },
    );

    expect(filter).toEqual({
      $and: [
        {
          isDeleted: false,
          isArchived: false,
          "flags.isProcedure": { $ne: true },
        },
        {
          $or: [
            { serialId: new RegExp(objectIdString, "i") },
            {
              serialId: new RegExp(
                objectIdString.replace(/\D/g, "").split("").join("\\D*"),
                "i",
              ),
            },
            { masterCaseId: new Types.ObjectId(objectIdString) },
            { patientId: { $in: ["patient-9"] } },
          ],
        },
      ],
    });
  });

  it("returns base case filters without extra clauses and supports numeric serial filters", async () => {
    const filter = await buildCasesFilter({
      serialId: 123,
    });

    expect(filter).toEqual({
      isDeleted: false,
      isArchived: false,
      serialId: /123/i,
    });
  });

  it("creates generic mongo handlers with optional populate support", async () => {
    const repo = {
      findManyLean: jest.fn(async () => [{ id: "doc-1" }]),
      countDocuments: jest.fn(async () => 7),
    };
    const baseFilter = jest.fn((filter: any) => ({ ...filter, scoped: true }));
    const mapper = jest.fn((doc: any) => ({ mapped: doc.id }));
    const handler = createMongoHandler(repo as never, baseFilter, mapper, [
      "patientId",
    ]);

    await expect(
      handler.find(
        { status: "active" },
        { page: 2, limit: 5, sortBy: "updated_at", sortOrder: "desc" },
      ),
    ).resolves.toEqual([{ mapped: "doc-1" }]);
    await expect(handler.count({ status: "active" })).resolves.toBe(7);

    expect(repo.findManyLean).toHaveBeenCalledWith(
      { status: "active", scoped: true },
      {
        skip: 5,
        limit: 5,
        sort: { updatedAt: -1, _id: -1 },
        populate: ["patientId"],
      },
    );
    expect(repo.countDocuments).toHaveBeenCalledWith({
      status: "active",
      scoped: true,
    });
  });

  it("creates generic mongo handlers with the default identity base filter", async () => {
    const repo = {
      findManyLean: jest.fn(async () => [{ id: "doc-2" }]),
      countDocuments: jest.fn(async () => 1),
    };
    const mapper = jest.fn((doc: any) => doc.id);
    const handler = createMongoHandler(repo as never, undefined as never, mapper);

    await expect(
      handler.find(
        { status: "plain" },
        { page: 1, limit: 10, sortBy: "id", sortOrder: "asc" },
      ),
    ).resolves.toEqual(["doc-2"]);
    await expect(handler.count({ status: "plain" })).resolves.toBe(1);

    expect(repo.findManyLean).toHaveBeenCalledWith(
      { status: "plain" },
      {
        skip: 0,
        limit: 10,
        sort: { _id: 1 },
      },
    );
    expect(repo.countDocuments).toHaveBeenCalledWith({ status: "plain" });
  });

  it("creates medicine system-type handlers with mapped filters and delegated row mapping", async () => {
    const categoryQuery = createModelQuery([{ _id: "cat-1" }]);
    systemTypesRepositoryMocks.getModel.mockReturnValue(categoryQuery.model);
    systemTypesRepositoryMocks.findPaginated.mockResolvedValue([
      { _id: "med-1", name: "Carprofen" },
    ]);
    systemTypesRepositoryMocks.countDocuments.mockResolvedValue(11);
    toAdminMedicineRowDTOMock.mockReturnValue({ id: "med-1", name: "Carprofen" });

    const handler = createSystemTypeHandler(SYSTEM_TYPE_NAMES.MEDICINES);

    await expect(
      handler.find(
        {
          medicine_category: "NSAID",
          range_min: "2.5",
          created_at: "2026-04",
          is_deleted: "true",
          name: "Carprofen",
        },
        { page: 2, limit: 10, sortBy: "serial_id", sortOrder: "asc" },
      ),
    ).resolves.toEqual([{ id: "med-1", name: "Carprofen" }]);

    await expect(
      handler.count({
        medicine_category: "NSAID",
      }),
    ).resolves.toBe(11);

    expect(systemTypesRepositoryMocks.getModel).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.MEDICINE_CATEGORIES,
    );
    expect(categoryQuery.find).toHaveBeenCalledWith({ name: /NSAID/i });
    expect(systemTypesRepositoryMocks.findPaginated).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.MEDICINES,
      {
        categoryId: { $in: ["cat-1"] },
        rangeMin: 2.5,
        createdAt: {
          $gte: new Date("2026-04-01T00:00:00.000Z"),
          $lt: new Date("2026-05-01T00:00:00.000Z"),
        },
        isDeleted: true,
        name: /Carprofen/i,
      },
      2,
      10,
      "serialId",
      "asc",
      [
        "categoryId",
        "measureUnitTypeId",
        "dosageFrequencyId",
        "routeOfAdministrationId",
      ],
    );
    expect(toAdminMedicineRowDTOMock).toHaveBeenCalledWith({
      _id: "med-1",
      name: "Carprofen",
    });
    expect(systemTypesRepositoryMocks.countDocuments).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.MEDICINES,
      {
        categoryId: { $in: ["cat-1"] },
      },
    );
  });

  it("creates animal-vitals system handlers with reference filters and mapped rows", async () => {
    const animalTypeQuery = createModelQuery([{ _id: "animal-1" }]);
    systemTypesRepositoryMocks.getModel.mockReturnValue(animalTypeQuery.model);
    systemTypesRepositoryMocks.findPaginated.mockResolvedValue([
      {
        _id: "vital-1",
        name: "Temperature",
        animalTypeId: { _id: "animal-1", name: "Dog" },
        vitalsType: " ",
        rangeMin: 37,
        rangeMax: 39,
        unit: " C ",
        isDeleted: false,
      },
    ]);

    const handler = createSystemTypeHandler(SYSTEM_TYPE_NAMES.ANIMAL_VITALS);

    await expect(
      handler.find(
        { animal_type: "Dog" },
        { page: 1, limit: 25, sortBy: "name", sortOrder: "desc" },
      ),
    ).resolves.toEqual([
      {
        id: "vital-1",
        name: "Temperature",
        serial_id: null,
        is_deleted: false,
        created_at: null,
        updated_at: null,
        animal_type_id: "animal-1",
        animal_type: "Dog",
        vitals_type: "Temperature",
        range_min: 37,
        range_max: 39,
        unit: "C",
      },
    ]);

    expect(systemTypesRepositoryMocks.findPaginated).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
      {
        animalTypeId: { $in: ["animal-1"] },
      },
      1,
      25,
      "name",
      "desc",
      ["animalTypeId"],
    );
  });

  it("maps null reference ids in race-type rows", async () => {
    systemTypesRepositoryMocks.findPaginated.mockResolvedValue([
      {
        _id: "race-2",
        name: "Mixed",
        animalTypeId: null,
      },
    ]);

    const handler = createSystemTypeHandler(SYSTEM_TYPE_NAMES.RACE_TYPES);

    await expect(
      handler.find(
        {},
        { page: 1, limit: 5, sortBy: "name", sortOrder: "asc" },
      ),
    ).resolves.toEqual([
      {
        id: "race-2",
        name: "Mixed",
        serial_id: null,
        is_deleted: false,
        created_at: null,
        updated_at: null,
        animal_type_id: null,
        animal_type: null,
      },
    ]);
  });

  it("creates base system-type handlers with invalid date fallbacks and no populate fields", async () => {
    systemTypesRepositoryMocks.findPaginated.mockResolvedValue([
      {
        _id: "food-1",
        name: "  Kibble  ",
        serialId: " F1 ",
        isDeleted: true,
        createdAt: "2026",
        updatedAt: "2026-13",
      },
    ]);

    const handler = createSystemTypeHandler(SYSTEM_TYPE_NAMES.FOOD_TYPES);

    await expect(
      handler.find(
        {
          created_at: "2026-13",
          updated_at: "2026",
          is_deleted: false,
          name: "   ",
          active: true,
        },
        { page: 1, limit: 5, sortBy: "name", sortOrder: "asc" },
      ),
    ).resolves.toEqual([
      {
        id: "food-1",
        name: "Kibble",
        serial_id: "F1",
        is_deleted: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: null,
      },
    ]);

    expect(systemTypesRepositoryMocks.findPaginated).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.FOOD_TYPES,
      {
        createdAt: /2026-13/i,
        updatedAt: {
          $gte: new Date("2026-01-01T00:00:00.000Z"),
          $lt: new Date("2027-01-01T00:00:00.000Z"),
        },
        isDeleted: false,
        active: true,
      },
      1,
      5,
      "name",
      "asc",
      undefined,
    );
  });

  it("creates race-type rows and throws when system-type rows are missing ids", async () => {
    systemTypesRepositoryMocks.findPaginated
      .mockResolvedValueOnce([
        {
          _id: "race-1",
          name: "Labrador",
          animalTypeId: "animal-1",
        },
      ])
      .mockResolvedValueOnce([{}]);

    const raceHandler = createSystemTypeHandler(SYSTEM_TYPE_NAMES.RACE_TYPES);
    const genericHandler = createSystemTypeHandler(SYSTEM_TYPE_NAMES.FOOD_TYPES);

    await expect(
      raceHandler.find(
        {},
        { page: 1, limit: 5, sortBy: "name", sortOrder: "asc" },
      ),
    ).resolves.toEqual([
      {
        id: "race-1",
        name: "Labrador",
        serial_id: null,
        is_deleted: false,
        created_at: null,
        updated_at: null,
        animal_type_id: "animal-1",
        animal_type: null,
      },
    ]);

    await expect(
      genericHandler.find(
        {},
        { page: 1, limit: 5, sortBy: "name", sortOrder: "asc" },
      ),
    ).rejects.toThrow('System type "food_types" row is missing _id');
  });

  it("handles empty and single-clause audit-log filters", async () => {
    await expect(
      buildAuditLogsFilter({
        description: "   ",
      }),
    ).resolves.toEqual({});

    await expect(
      buildAuditLogsFilter({
        archived: true,
        description: "   ",
      }),
    ).resolves.toEqual({ archived: true });
  });

  it("builds patient-name audit filters without case lookups when no matching patients exist", async () => {
    patientRepositoryMocks.searchCasePatientIds.mockResolvedValue([]);

    await expect(
      buildAuditLogsFilter({
        [TABLE_SORT_FIELDS.PATIENT_NAME]: "ghost",
      }),
    ).resolves.toEqual({
      $and: [
        { entityType: "Case" },
        { entityId: { $in: [] } },
      ],
    });

    expect(caseRepositoryMocks.findManyLean).not.toHaveBeenCalled();
  });

  it("formats audit creator names across supported shapes", () => {
    expect(toCreatedByName(undefined)).toBe("");
    expect(toCreatedByName("user-1" as never)).toBe("user-1");
    expect(
      toCreatedByName({
        toString: () => "507f1f77bcf86cd799439011",
      } as never),
    ).toBe("507f1f77bcf86cd799439011");
    expect(toCreatedByName({ username: "dana" } as never)).toBe("dana");
    expect(toCreatedByName({ email: "dana@example.com" } as never)).toBe(
      "[object Object]",
    );
    expect(toCreatedByName({} as never)).toBe("[object Object]");

    const emailOnly = Object.create(null) as { email: string };
    emailOnly.email = "dana@example.com";
    expect(toCreatedByName(emailOnly as never)).toBe("dana@example.com");

    const emptyObject = Object.create(null);
    expect(toCreatedByName(emptyObject as never)).toBe("");
  });
});
