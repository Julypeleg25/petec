import { StaffMemberListResponseDTOSchema } from "@petec/shared";
import { jest } from "@jest/globals";

const getDoctorsMock = jest.fn<(...args: any[]) => Promise<any>>();
const getNursesMock = jest.fn<(...args: any[]) => Promise<any>>();
const sendSuccessMock = jest.fn<(...args: any[]) => void>();

jest.unstable_mockModule("../../src/services/user/index.js", () => ({
  userService: {
    getDoctors: getDoctorsMock,
    getNurses: getNursesMock,
  },
}));

jest.unstable_mockModule("../../src/utils/apiResponse.js", () => ({
  sendSuccess: sendSuccessMock,
}));

const { UserController } = await import("../../src/controllers/user/user.controller.js");

describe("UserController", () => {
  const controller = new UserController();
  const res = {} as never;
  const next = jest.fn<(err?: unknown) => void>();

  beforeEach(() => {
    getDoctorsMock.mockReset();
    getNursesMock.mockReset();
    sendSuccessMock.mockReset();
    next.mockReset();
  });

  it("returns doctors using the staff member response schema", async () => {
    const result = [{ id: "doctor-1" }];
    getDoctorsMock.mockResolvedValue(result);

    await controller.getDoctors({} as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      StaffMemberListResponseDTOSchema,
    );
  });

  it("returns nurses using the staff member response schema", async () => {
    const result = [{ id: "nurse-1" }];
    getNursesMock.mockResolvedValue(result);

    await controller.getNurses({} as never, res, next);

    expect(sendSuccessMock).toHaveBeenCalledWith(
      res,
      result,
      StaffMemberListResponseDTOSchema,
    );
  });

  it("forwards service failures to next", async () => {
    const error = new Error("nurse lookup failed");
    getNursesMock.mockRejectedValue(error);

    await controller.getNurses({} as never, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("forwards doctor lookup failures to next", async () => {
    const error = new Error("doctor lookup failed");
    getDoctorsMock.mockRejectedValue(error);

    await controller.getDoctors({} as never, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
