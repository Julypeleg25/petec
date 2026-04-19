import {
  MEDICINE_ACTIVE_FILTER,
  MEDICINE_SORT,
} from "./medicineService.utils.js";

describe("medicineService.utils", () => {
  it("exports the expected medicine constants", () => {
    expect(MEDICINE_SORT).toEqual({ name: 1 });
    expect(MEDICINE_ACTIVE_FILTER).toEqual({
      isDeleted: { $ne: true },
    });
  });
});
