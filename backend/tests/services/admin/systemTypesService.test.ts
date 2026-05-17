import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { jest } from "@jest/globals";
import { NotFoundError } from "../../../src/constants/error.constants.js";

const findActiveMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const findAllMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const findByIdMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const createMock = jest.fn<(...args: any[]) => Promise<any>>();
const updateMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const removeMock = jest.fn<(...args: any[]) => Promise<any | null>>();
const findByAnimalTypeIdMock = jest.fn<(...args: any[]) => Promise<any[]>>();

const ensureSystemTypeNameIsUniqueMock = jest.fn<(...args: any[]) => Promise<void>>();
const toCreateSystemTypePayloadMock = jest.fn<(...args: any[]) => any>();
const toUpdateSystemTypePayloadMock = jest.fn<(...args: any[]) => any>();
const infoMock = jest.fn<(...args: any[]) => void>();

jest.unstable_mockModule("../../../src/repositories/admin/index.js", () => ({
  systemTypesRepository: {
    findActive: findActiveMock,
    findAll: findAllMock,
    findById: findByIdMock,
    create: createMock,
    update: updateMock,
    remove: removeMock,
    findByAnimalTypeId: findByAnimalTypeIdMock,
  },
}));

jest.unstable_mockModule("../../../src/services/admin/utils/index.js", () => ({
  ensureSystemTypeNameIsUnique: ensureSystemTypeNameIsUniqueMock,
  toCreateSystemTypePayload: toCreateSystemTypePayloadMock,
  toUpdateSystemTypePayload: toUpdateSystemTypePayloadMock,
}));

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  logger: {
    info: infoMock,
  },
}));

const { SystemTypesService } = await import(
  "../../../src/services/admin/systemTypesService.js"
);

const createDoc = (data: any) => ({
  _id: data._id ?? { toString: () => "doc-1" },
  toObject: jest.fn(() => data),
});

describe("SystemTypesService", () => {
  const service = new SystemTypesService();

  beforeEach(() => {
    findActiveMock.mockReset();
    findAllMock.mockReset();
    findByIdMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    removeMock.mockReset();
    findByAnimalTypeIdMock.mockReset();
    ensureSystemTypeNameIsUniqueMock.mockReset();
    toCreateSystemTypePayloadMock.mockReset();
    toUpdateSystemTypePayloadMock.mockReset();
    infoMock.mockReset();
  });

  it("returns active system types as plain objects", async () => {
    const docA = createDoc({ _id: "type-1", name: "A" });
    const docB = createDoc({ _id: "type-2", name: "B" });
    findActiveMock.mockResolvedValue([docA, docB]);

    await expect(
      service.getAll(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION),
    ).resolves.toEqual([
      { _id: "type-1", name: "A" },
      { _id: "type-2", name: "B" },
    ]);

    expect(findActiveMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    );
  });

  it("returns all system types including inactive rows", async () => {
    const doc = createDoc({ _id: "type-1", name: "A", isDeleted: true });
    findAllMock.mockResolvedValue([doc]);

    await expect(
      service.getAllIncludingInactive(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION),
    ).resolves.toEqual([{ _id: "type-1", name: "A", isDeleted: true }]);
  });

  it("returns a system type by id", async () => {
    const doc = createDoc({ _id: "type-1", name: "A" });
    findByIdMock.mockResolvedValue(doc);

    await expect(
      service.getById(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, "type-1"),
    ).resolves.toEqual({ _id: "type-1", name: "A" });
  });

  it("throws when getById cannot find a system type", async () => {
    findByIdMock.mockResolvedValue(null);

    await expect(
      service.getById(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, "missing"),
    ).rejects.toThrow(NotFoundError);
  });

  it("creates a system type, checking uniqueness when a name is provided", async () => {
    const payload = { name: "IV", isDeleted: false };
    const doc = createDoc({
      _id: { toString: () => "created-1" },
      name: "IV",
      isDeleted: false,
    });
    ensureSystemTypeNameIsUniqueMock.mockResolvedValue(undefined);
    toCreateSystemTypePayloadMock.mockReturnValue(payload);
    createMock.mockResolvedValue(doc);

    await expect(
      service.create(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, { name: "IV" }),
    ).resolves.toEqual({
      _id: { toString: expect.any(Function) },
      name: "IV",
      isDeleted: false,
    });

    expect(ensureSystemTypeNameIsUniqueMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      "IV",
    );
    expect(toCreateSystemTypePayloadMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      { name: "IV" },
    );
    expect(createMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      payload,
    );
    expect(infoMock).toHaveBeenCalledWith("System type created", {
      module: "admin",
      event: "admin_system_type_created",
      type_name: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      entity_id: "created-1",
    });
  });

  it("skips uniqueness checks on create when the name is missing", async () => {
    const payload = { serialId: "X-1" };
    const doc = createDoc({ _id: "type-1", serialId: "X-1" });
    toCreateSystemTypePayloadMock.mockReturnValue(payload);
    createMock.mockResolvedValue(doc);

    await service.create(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, {
      serialId: "X-1",
    } as never);

    expect(ensureSystemTypeNameIsUniqueMock).not.toHaveBeenCalled();
  });

  it("updates a system type, checking uniqueness when a name is provided", async () => {
    const payload = { name: "Oral" };
    const doc = createDoc({ _id: "type-1", name: "Oral" });
    ensureSystemTypeNameIsUniqueMock.mockResolvedValue(undefined);
    toUpdateSystemTypePayloadMock.mockReturnValue(payload);
    updateMock.mockResolvedValue(doc);

    await expect(
      service.update(
        SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
        "type-1",
        { name: "Oral" },
      ),
    ).resolves.toEqual({ _id: "type-1", name: "Oral" });

    expect(ensureSystemTypeNameIsUniqueMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      "Oral",
      "type-1",
    );
    expect(toUpdateSystemTypePayloadMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      { name: "Oral" },
    );
    expect(updateMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      "type-1",
      payload,
    );
    expect(infoMock).toHaveBeenCalledWith("System type updated", {
      module: "admin",
      event: "admin_system_type_updated",
      type_name: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      entity_id: "type-1",
    });
  });

  it("throws when update cannot find a system type", async () => {
    ensureSystemTypeNameIsUniqueMock.mockResolvedValue(undefined);
    toUpdateSystemTypePayloadMock.mockReturnValue({ name: "Oral" });
    updateMock.mockResolvedValue(null);

    await expect(
      service.update(
        SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
        "missing",
        { name: "Oral" },
      ),
    ).rejects.toThrow(NotFoundError);

    expect(infoMock).not.toHaveBeenCalled();
  });

  it("removes a system type and logs the deletion", async () => {
    removeMock.mockResolvedValue(createDoc({ _id: "type-1", isDeleted: true }));

    await expect(
      service.remove(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, "type-1"),
    ).resolves.toBeUndefined();

    expect(infoMock).toHaveBeenCalledWith("System type deleted", {
      module: "admin",
      event: "admin_system_type_deleted",
      type_name: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
      entity_id: "type-1",
    });
  });

  it("throws when remove cannot find a system type", async () => {
    removeMock.mockResolvedValue(null);

    await expect(
      service.remove(SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION, "missing"),
    ).rejects.toThrow(NotFoundError);
  });

  it("returns types filtered by animal type id", async () => {
    const doc = createDoc({ _id: "type-1", animalTypeId: "animal-1" });
    findByAnimalTypeIdMock.mockResolvedValue([doc]);

    await expect(
      service.getByAnimalTypeId(SYSTEM_TYPE_NAMES.RACE_TYPES, "animal-1"),
    ).resolves.toEqual([{ _id: "type-1", animalTypeId: "animal-1" }]);
  });
});
