import {
  AnimalVitalListResponseDTOSchema,
  RaceTypeListResponseDTOSchema,
  SimpleSystemTypeDTOSchema,
  SimpleSystemTypeListResponseDTOSchema,
  SYSTEM_TYPE_NAMES,
  UserResponseDTOSchema,
  UserRowListResponseDTOSchema,
} from "@petec/shared";
import { jest } from "@jest/globals";

const getAllIncludingInactiveMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const getAllMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const createMock = jest.fn<(...args: any[]) => Promise<any>>();
const updateMock = jest.fn<(...args: any[]) => Promise<any>>();
const removeMock = jest.fn<(...args: any[]) => Promise<void>>();
const getByAnimalTypeIdMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const getAllUsersMock = jest.fn<(...args: any[]) => Promise<any[]>>();
const updateUserMock = jest.fn<(...args: any[]) => Promise<any>>();
const deleteUserMock = jest.fn<(...args: any[]) => Promise<void>>();

const sendSuccessMock = jest.fn<(...args: any[]) => void>();
const sendCreatedMock = jest.fn<(...args: any[]) => void>();
const sendNoContentMock = jest.fn<(...args: any[]) => void>();
const getValidatedBodyMock = jest.fn<(req: any) => any>();
const getValidatedParamsMock = jest.fn<(req: any) => any>();

const toSimpleSystemTypeDTOMock = jest.fn<(item: any) => any>();
const toRaceTypeDTOMock = jest.fn<(item: any) => any>();
const toAnimalVitalDTOMock = jest.fn<(item: any) => any>();

jest.unstable_mockModule("../../../src/services/admin/index.js", () => ({
  systemTypesService: {
    getAllIncludingInactive: getAllIncludingInactiveMock,
    getAll: getAllMock,
    create: createMock,
    update: updateMock,
    remove: removeMock,
    getByAnimalTypeId: getByAnimalTypeIdMock,
  },
}));

jest.unstable_mockModule("../../../src/services/user/index.js", () => ({
  userService: {
    getAllUsers: getAllUsersMock,
    updateUser: updateUserMock,
    deleteUser: deleteUserMock,
  },
}));

jest.unstable_mockModule("../../../src/utils/apiResponse.js", () => ({
  sendSuccess: sendSuccessMock,
  sendCreated: sendCreatedMock,
  sendNoContent: sendNoContentMock,
}));

jest.unstable_mockModule("../../../src/utils/request.utils.js", () => ({
  getValidatedBody: getValidatedBodyMock,
  getValidatedParams: getValidatedParamsMock,
}));

jest.unstable_mockModule("../../../src/mappers/admin/index.js", () => ({
  toSimpleSystemTypeDTO: toSimpleSystemTypeDTOMock,
  toRaceTypeDTO: toRaceTypeDTOMock,
  toAnimalVitalDTO: toAnimalVitalDTOMock,
}));

const { AdminController } = await import(
  "../../../src/controllers/admin/admin.controller.js"
);

describe("AdminController", () => {
  const controller = new AdminController();
  const res = {} as never;
  const next = jest.fn<(err?: unknown) => void>();

  beforeEach(() => {
    getAllIncludingInactiveMock.mockReset();
    getAllMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    removeMock.mockReset();
    getByAnimalTypeIdMock.mockReset();
    getAllUsersMock.mockReset();
    updateUserMock.mockReset();
    deleteUserMock.mockReset();
    sendSuccessMock.mockReset();
    sendCreatedMock.mockReset();
    sendNoContentMock.mockReset();
    getValidatedBodyMock.mockReset();
    getValidatedParamsMock.mockReset();
    toSimpleSystemTypeDTOMock.mockReset();
    toRaceTypeDTOMock.mockReset();
    toAnimalVitalDTOMock.mockReset();
    next.mockReset();
  });

  it("returns all types including inactive rows using simple DTO mapping", async () => {
    const docs = [{ _id: "type-1" }, { _id: "type-2" }];
    getValidatedParamsMock.mockReturnValue({
      typeName: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    });
    getAllIncludingInactiveMock.mockResolvedValue(docs);
    toSimpleSystemTypeDTOMock
      .mockReturnValueOnce({ id: "dto-1" })
      .mockReturnValueOnce({ id: "dto-2" });

    await controller.getAllTypes({ params: {} } as never, res, next);

    expect(getAllIncludingInactiveMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    );
    expect(toSimpleSystemTypeDTOMock.mock.calls[0]?.[0]).toBe(docs[0]);
    expect(toSimpleSystemTypeDTOMock.mock.calls[1]?.[0]).toBe(docs[1]);
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      [{ id: "dto-1" }, { id: "dto-2" }],
      SimpleSystemTypeListResponseDTOSchema,
    );
  });

  it("returns active types using simple DTO mapping", async () => {
    const docs = [{ _id: "type-1" }];
    getValidatedParamsMock.mockReturnValue({
      typeName: SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES,
    });
    getAllMock.mockResolvedValue(docs);
    toSimpleSystemTypeDTOMock.mockReturnValue({ id: "dto-1" });

    await controller.getActiveTypes({ params: {} } as never, res, next);

    expect(getAllMock).toHaveBeenCalledWith(SYSTEM_TYPE_NAMES.DOSAGE_FREQUENCIES);
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      [{ id: "dto-1" }],
      SimpleSystemTypeListResponseDTOSchema,
    );
  });

  it("creates a type and returns a created simple DTO", async () => {
    const params = { typeName: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES };
    const body = { name: "mg" };
    const created = { _id: "type-1", name: "mg" };
    getValidatedParamsMock.mockReturnValue(params);
    getValidatedBodyMock.mockReturnValue(body);
    createMock.mockResolvedValue(created);
    toSimpleSystemTypeDTOMock.mockReturnValue({ id: "dto-1", name: "mg" });

    await controller.createType({ body, params } as never, res, next);

    expect(createMock).toHaveBeenCalledWith(params.typeName, body);
    expect(sendCreatedMock).toHaveBeenCalledWith(
      res,
      { id: "dto-1", name: "mg" },
      SimpleSystemTypeDTOSchema,
    );
  });

  it("updates a type after stripping the payload id", async () => {
    const params = {
      typeName: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
      id: "type-1",
    };
    const body = { id: "ignore-me", name: "Dog" };
    const updated = { _id: "type-1", name: "Dog" };
    getValidatedParamsMock.mockReturnValue(params);
    getValidatedBodyMock.mockReturnValue(body);
    updateMock.mockResolvedValue(updated);
    toSimpleSystemTypeDTOMock.mockReturnValue({ id: "dto-1", name: "Dog" });

    await controller.updateType({ body, params } as never, res, next);

    expect(updateMock).toHaveBeenCalledWith(params.typeName, params.id, {
      name: "Dog",
    });
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      { id: "dto-1", name: "Dog" },
      SimpleSystemTypeDTOSchema,
    );
  });

  it("deletes a type and returns no content", async () => {
    const params = {
      typeName: SYSTEM_TYPE_NAMES.RACE_TYPES,
      id: "type-1",
    };
    getValidatedParamsMock.mockReturnValue(params);
    removeMock.mockResolvedValue(undefined);

    await controller.deleteType({ params } as never, res, next);

    expect(removeMock).toHaveBeenCalledWith(params.typeName, params.id);
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });

  it("maps race-type lookups with the race schema", async () => {
    const docs = [{ _id: "race-1" }];
    getValidatedParamsMock.mockReturnValue({
      typeName: SYSTEM_TYPE_NAMES.RACE_TYPES,
      animalTypeId: "animal-1",
    });
    getByAnimalTypeIdMock.mockResolvedValue(docs);
    toRaceTypeDTOMock.mockReturnValue({ id: "dto-race" });

    await controller.getTypesByAnimalType({ params: {} } as never, res, next);

    expect(getByAnimalTypeIdMock).toHaveBeenCalledWith(
      SYSTEM_TYPE_NAMES.RACE_TYPES,
      "animal-1",
    );
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      [{ id: "dto-race" }],
      RaceTypeListResponseDTOSchema,
    );
  });

  it("maps animal vital lookups with the animal-vital schema", async () => {
    const docs = [{ _id: "vital-1" }];
    getValidatedParamsMock.mockReturnValue({
      typeName: SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
      animalTypeId: "animal-1",
    });
    getByAnimalTypeIdMock.mockResolvedValue(docs);
    toAnimalVitalDTOMock.mockReturnValue({ id: "dto-vital" });

    await controller.getTypesByAnimalType({ params: {} } as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      [{ id: "dto-vital" }],
      AnimalVitalListResponseDTOSchema,
    );
  });

  it("maps other animal-specific lookups with the simple schema", async () => {
    const docs = [{ _id: "lookup-1" }];
    getValidatedParamsMock.mockReturnValue({
      typeName: SYSTEM_TYPE_NAMES.FOOD_TYPES,
      animalTypeId: "animal-1",
    });
    getByAnimalTypeIdMock.mockResolvedValue(docs);
    toSimpleSystemTypeDTOMock.mockReturnValue({ id: "dto-lookup" });

    await controller.getTypesByAnimalType({ params: {} } as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      [{ id: "dto-lookup" }],
      SimpleSystemTypeListResponseDTOSchema,
    );
  });

  it("returns all users through the user service", async () => {
    const rows = [{ id: "user-1" }];
    getAllUsersMock.mockResolvedValue(rows);

    await controller.getAllUsers({} as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      rows,
      UserRowListResponseDTOSchema,
    );
  });

  it("updates a user and returns the user response schema", async () => {
    const params = { userId: "user-1" };
    const body = { firstName: "Amy" };
    const user = { id: "user-1", firstName: "Amy" };
    getValidatedParamsMock.mockReturnValue(params);
    getValidatedBodyMock.mockReturnValue(body);
    updateUserMock.mockResolvedValue(user);

    await controller.updateUser({ params, body } as never, res, next);

    expect(updateUserMock).toHaveBeenCalledWith("user-1", body);
    expect(sendSuccessMock).toHaveBeenCalledWith(res, user, UserResponseDTOSchema);
  });

  it("deletes a user and returns no content", async () => {
    getValidatedParamsMock.mockReturnValue({ userId: "user-1" });
    deleteUserMock.mockResolvedValue(undefined);

    await controller.deleteUser({ params: {} } as never, res, next);

    expect(deleteUserMock).toHaveBeenCalledWith("user-1");
    expect(sendNoContentMock).toHaveBeenCalledWith(res);
  });

  it("forwards failures to next", async () => {
    const error = new Error("admin failed");
    getValidatedParamsMock.mockReturnValue({
      typeName: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
    });
    getAllMock.mockRejectedValue(error);

    await controller.getActiveTypes({ params: {} } as never, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it.each([
    [
      "getAllTypes",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({
          typeName: SYSTEM_TYPE_NAMES.ROUTES_OF_ADMINISTRATION,
        });
        getAllIncludingInactiveMock.mockRejectedValue(error);
      },
      () => controller.getAllTypes({ params: {} } as never, res, next),
    ],
    [
      "createType",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ typeName: SYSTEM_TYPE_NAMES.MEASURE_UNIT_TYPES });
        getValidatedBodyMock.mockReturnValue({ name: "mg" });
        createMock.mockRejectedValue(error);
      },
      () => controller.createType({ params: {}, body: {} } as never, res, next),
    ],
    [
      "updateType",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({
          typeName: SYSTEM_TYPE_NAMES.ANIMAL_TYPES,
          id: "type-1",
        });
        getValidatedBodyMock.mockReturnValue({ id: "ignore-me", name: "Dog" });
        updateMock.mockRejectedValue(error);
      },
      () => controller.updateType({ params: {}, body: {} } as never, res, next),
    ],
    [
      "deleteType",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({
          typeName: SYSTEM_TYPE_NAMES.RACE_TYPES,
          id: "type-1",
        });
        removeMock.mockRejectedValue(error);
      },
      () => controller.deleteType({ params: {} } as never, res, next),
    ],
    [
      "getTypesByAnimalType",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({
          typeName: SYSTEM_TYPE_NAMES.FOOD_TYPES,
          animalTypeId: "animal-1",
        });
        getByAnimalTypeIdMock.mockRejectedValue(error);
      },
      () => controller.getTypesByAnimalType({ params: {} } as never, res, next),
    ],
    [
      "getAllUsers",
      (error: Error) => {
        getAllUsersMock.mockRejectedValue(error);
      },
      () => controller.getAllUsers({} as never, res, next),
    ],
    [
      "updateUser",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ userId: "user-1" });
        getValidatedBodyMock.mockReturnValue({ firstName: "Amy" });
        updateUserMock.mockRejectedValue(error);
      },
      () => controller.updateUser({ params: {}, body: {} } as never, res, next),
    ],
    [
      "deleteUser",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({ userId: "user-1" });
        deleteUserMock.mockRejectedValue(error);
      },
      () => controller.deleteUser({ params: {} } as never, res, next),
    ],
  ] as const)(
    "forwards %s failures to next",
    async (_methodName, arrange, invoke) => {
      const error = new Error("admin failed");
      arrange(error);

      await invoke();

      expect(next).toHaveBeenCalledWith(error);
    },
  );
});
