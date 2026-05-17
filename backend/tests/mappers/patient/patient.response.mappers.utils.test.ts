import { Types } from "mongoose";
import {
  isPopulatedPatient,
  resolveCaseRefs,
} from "../../../src/mappers/patient/patient.response.mappers.utils.js";

describe("patient.response.mappers.utils", () => {
  it("resolves case refs with patient fallback values", () => {
    expect(
      resolveCaseRefs(
        {
          genderTypeId: "gender-1",
          animalTypeId: undefined,
        } as never,
        {
          refs: {
            animalTypeId: "animal-1",
            raceTypeId: "race-1",
            animalColorId: "color-1",
            insuranceTypeId: "insurance-1",
            foodTypeId: "food-1",
          },
        } as never,
      ),
    ).toEqual({
      animalTypeId: "animal-1",
      genderTypeId: "gender-1",
      raceTypeId: "race-1",
      animalColorId: "color-1",
      insuranceTypeId: "insurance-1",
      foodTypeId: "food-1",
    });
  });

  it("detects populated patient references while excluding raw object ids", () => {
    expect(isPopulatedPatient("patient-1")).toBe(false);
    expect(isPopulatedPatient(new Types.ObjectId().toString())).toBe(false);
    expect(
      isPopulatedPatient({
        _id: "patient-1",
        name: "Milo",
      } as never),
    ).toBe(true);
    expect(
      isPopulatedPatient({
        toHexString: () => "507f1f77bcf86cd799439011",
      } as never),
    ).toBe(false);
  });
});
