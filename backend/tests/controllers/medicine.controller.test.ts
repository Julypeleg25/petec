import {
  MEDICINE_CATEGORY_TYPES,
  MedicineListResponseDTOSchema,
  SimpleSystemTypeListResponseDTOSchema,
} from "@petec/shared";
import { jest } from "@jest/globals";

const getAllMock = jest.fn<(...args: any[]) => Promise<any>>();
const getAllByCategoryTypeMock = jest.fn<(...args: any[]) => Promise<any>>();
const getAllCategoryTypesMock = jest.fn<(...args: any[]) => Promise<any>>();
const getMedicinesFrequenciesMock = jest.fn<(...args: any[]) => Promise<any>>();
const getMedicinesRoutesForAdministrationMock = jest.fn<
  (...args: any[]) => Promise<any>
>();
const getMeasureUnitTypesMock = jest.fn<(...args: any[]) => Promise<any>>();
const sendSuccessMock = jest.fn<(...args: any[]) => void>();
const getValidatedParamsMock = jest.fn<(req: any) => any>();

jest.unstable_mockModule("../../src/services/medicine/index.js", () => ({
  medicineService: {
    getAll: getAllMock,
    getAllByCategoryType: getAllByCategoryTypeMock,
    getAllCategoryTypes: getAllCategoryTypesMock,
    getMedicinesFrequencies: getMedicinesFrequenciesMock,
    getMedicinesRoutesForAdministration: getMedicinesRoutesForAdministrationMock,
    getMeasureUnitTypes: getMeasureUnitTypesMock,
  },
}));

jest.unstable_mockModule("../../src/utils/apiResponse.js", () => ({
  sendSuccess: sendSuccessMock,
}));

jest.unstable_mockModule("../../src/utils/request.utils.js", () => ({
  getValidatedParams: getValidatedParamsMock,
}));

const { MedicineController } = await import(
  "../../src/controllers/medicine/medicine.controller.js"
);

describe("MedicineController", () => {
  const controller = new MedicineController();
  const res = {} as never;
  const next = jest.fn<(err?: unknown) => void>();

  beforeEach(() => {
    getAllMock.mockReset();
    getAllByCategoryTypeMock.mockReset();
    getAllCategoryTypesMock.mockReset();
    getMedicinesFrequenciesMock.mockReset();
    getMedicinesRoutesForAdministrationMock.mockReset();
    getMeasureUnitTypesMock.mockReset();
    sendSuccessMock.mockReset();
    getValidatedParamsMock.mockReset();
    next.mockReset();
  });

  it("returns all medicines", async () => {
    const result = [{ id: "med-1" }];
    getAllMock.mockResolvedValue(result);

    await controller.getAll({} as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      MedicineListResponseDTOSchema,
    );
  });

  it("filters medicines by category type", async () => {
    const result = [{ id: "med-1" }];
    getValidatedParamsMock.mockReturnValue({
      categoryType: MEDICINE_CATEGORY_TYPES.MEDICINE,
    });
    getAllByCategoryTypeMock.mockResolvedValue(result);

    await controller.getAllByCategoryType({ params: {} } as never, res, next);

    expect(getAllByCategoryTypeMock).toHaveBeenCalledWith(
      MEDICINE_CATEGORY_TYPES.MEDICINE,
    );
    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      MedicineListResponseDTOSchema,
    );
  });

  it.each([
    ["getAllCategoryTypes", getAllCategoryTypesMock],
    ["getMedicinesFrequencies", getMedicinesFrequenciesMock],
    [
      "getMedicinesRoutesForAdministration",
      getMedicinesRoutesForAdministrationMock,
    ],
    ["getMeasureUnitTypes", getMeasureUnitTypesMock],
  ] as const)(
    "%s returns simple type lists",
    async (methodName, serviceMock) => {
      const result = [{ id: "type-1" }];
      serviceMock.mockResolvedValue(result);

      await controller[methodName]({} as never, res, next);

      expect(sendSuccessMock).toHaveBeenCalledWith(
        res,
        result,
        SimpleSystemTypeListResponseDTOSchema,
      );
    },
  );

  it("forwards service failures to next", async () => {
    const error = new Error("query failed");
    getAllMock.mockRejectedValue(error);

    await controller.getAll({} as never, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it.each([
    [
      "getAllByCategoryType",
      (error: Error) => {
        getValidatedParamsMock.mockReturnValue({
          categoryType: MEDICINE_CATEGORY_TYPES.MEDICINE,
        });
        getAllByCategoryTypeMock.mockRejectedValue(error);
      },
      () => controller.getAllByCategoryType({ params: {} } as never, res, next),
    ],
    [
      "getAllCategoryTypes",
      (error: Error) => {
        getAllCategoryTypesMock.mockRejectedValue(error);
      },
      () => controller.getAllCategoryTypes({} as never, res, next),
    ],
    [
      "getMedicinesFrequencies",
      (error: Error) => {
        getMedicinesFrequenciesMock.mockRejectedValue(error);
      },
      () => controller.getMedicinesFrequencies({} as never, res, next),
    ],
    [
      "getMedicinesRoutesForAdministration",
      (error: Error) => {
        getMedicinesRoutesForAdministrationMock.mockRejectedValue(error);
      },
      () => controller.getMedicinesRoutesForAdministration({} as never, res, next),
    ],
    [
      "getMeasureUnitTypes",
      (error: Error) => {
        getMeasureUnitTypesMock.mockRejectedValue(error);
      },
      () => controller.getMeasureUnitTypes({} as never, res, next),
    ],
  ] as const)(
    "forwards %s failures to next",
    async (_methodName, arrange, invoke) => {
      const error = new Error("medicine failed");
      arrange(error);

      await invoke();

      expect(next).toHaveBeenCalledWith(error);
    },
  );
});
