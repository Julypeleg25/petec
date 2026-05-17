import { Types } from "mongoose";
import { mapGridDtoToRows } from "../../../src/mappers/patient/patient.case-grid.request.mappers.js";

describe("patient.case-grid.request.mappers", () => {
  it("maps request grid DTO rows into case detail row payloads", () => {
    const urineTypeId = new Types.ObjectId().toString();
    const fecesTypeId = new Types.ObjectId().toString();
    const fluidMedicineId = new Types.ObjectId().toString();
    const medicineId = new Types.ObjectId().toString();
    const procedureTypeId = new Types.ObjectId().toString();
    const examTypeId = new Types.ObjectId().toString();
    const foodExtraTypeId = new Types.ObjectId().toString();

    const [row] = mapGridDtoToRows([
      [
        {
          date: "2026-04-21",
          time: "09:15",
          index: 3,
          temperature: "38.5",
          temperatureIsRequired: true,
          temperatureIsEditable: false,
          pulse: "80",
          pulseIsRequired: false,
          pulseIsEditable: true,
          respiration: "22",
          respirationIsRequired: true,
          respirationIsEditable: true,
          urineTypeId,
          urineComments: "clear",
          urineIsRequired: true,
          urineIsEditable: false,
          fecesTypeId,
          fecesComments: "normal",
          fecesIsRequired: false,
          fecesIsEditable: true,
          isBoxClean: true,
          isBoxCleanIsRequired: true,
          isBoxCleanIsEditable: false,
          isRelease: false,
          isReleaseIsRequired: false,
          isReleaseIsEditable: true,
          isTravel: true,
          isTravelIsRequired: true,
          isTravelIsEditable: true,
          weigh: "4.2",
          weighIsRequired: true,
          weighIsEditable: false,
          isPuke: false,
          pukeComments: "none",
          pukeIsRequired: false,
          pukeIsEditable: true,
          rowComments: "stable",
          rowCommentsIsRequired: true,
          rowCommentsIsEditable: true,
          ownerUpdate: "called owner",
          ownerUpdateIsRequired: false,
          ownerUpdateIsEditable: true,
          foodGiven: true,
          waterGiven: false,
          foodAndWater: "ate breakfast",
          foodAndWaterIsRequired: true,
          foodAndWaterIsEditable: false,
          fluids: [
            {
              medicineId: fluidMedicineId,
              dosageText: "slow drip",
              doseAmount: null,
              measureUnitTypeId: undefined,
              dosageFrequencyId: undefined,
              routeOfAdministrationId: undefined,
              isGiven: true,
              isRequired: true,
              isEditable: false,
              comment: "running",
            },
          ],
          medicines: [
            {
              medicineId,
              dosageText: "1 tablet",
              doseAmount: "2.5",
              measureUnitTypeId: undefined,
              dosageFrequencyId: undefined,
              routeOfAdministrationId: undefined,
              isGiven: false,
              isRequired: true,
              isEditable: true,
              comment: "after food",
            },
          ],
          procedures: [
            {
              typeId: procedureTypeId,
              isGiven: true,
              isRequired: true,
              isEditable: false,
              comment: "done",
            },
          ],
          examinations: [
            {
              typeId: examTypeId,
              value: "normal",
              isRequired: true,
              isEditable: true,
              comment: "checked",
            },
          ],
          foodExtras: [
            {
              typeId: foodExtraTypeId,
              isGiven: false,
              isRequired: false,
              isEditable: true,
              comment: "optional",
            },
          ],
        },
      ],
    ] as never);

    expect(row).toBeDefined();
    expect(row).toMatchObject({
      date: "2026-04-21",
      time: "09:15",
      index: 3,
      temperature: "38.5",
      urineComments: "clear",
      fecesComments: "normal",
      foodAndWater: "ate breakfast",
    });
    expect(row!.urineTypeId).toBeInstanceOf(Types.ObjectId);
    expect(row!.fecesTypeId).toBeInstanceOf(Types.ObjectId);
    expect(row!.fluids?.[0]?.medicineId).toBeInstanceOf(Types.ObjectId);
    expect(row!.fluids?.[0]?.doseAmount).toBeUndefined();
    expect(row!.medicines?.[0]?.medicineId).toBeInstanceOf(Types.ObjectId);
    expect(row!.medicines?.[0]?.doseAmount).toBe(2.5);
    expect(row!.procedures?.[0]?.typeId).toBeInstanceOf(Types.ObjectId);
    expect(row!.examinations?.[0]?.typeId).toBeInstanceOf(Types.ObjectId);
    expect(row!.foodExtras?.[0]?.typeId).toBeInstanceOf(Types.ObjectId);
  });
});
