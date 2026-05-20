import { jest } from "@jest/globals";
import { Types } from "mongoose";
import {
  mapEditDtoToCaseUpdate,
  mapNewPatientDtoToCaseData,
  mapRefsToObjectIds,
} from "../../../src/mappers/patient/patient.case-data.mappers.js";

describe("patient.case-data.mappers", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("maps case refs to object ids", () => {
    const refs = mapRefsToObjectIds({
      animalTypeId: new Types.ObjectId().toString(),
      genderTypeId: new Types.ObjectId().toString(),
      raceTypeId: new Types.ObjectId().toString(),
      animalColorId: new Types.ObjectId().toString(),
      insuranceTypeId: new Types.ObjectId().toString(),
      foodTypeId: new Types.ObjectId().toString(),
    } as never);

    expect(refs.animalTypeId).toBeInstanceOf(Types.ObjectId);
    expect(refs.genderTypeId).toBeInstanceOf(Types.ObjectId);
    expect(refs.raceTypeId).toBeInstanceOf(Types.ObjectId);
    expect(refs.animalColorId).toBeInstanceOf(Types.ObjectId);
    expect(refs.insuranceTypeId).toBeInstanceOf(Types.ObjectId);
    expect(refs.foodTypeId).toBeInstanceOf(Types.ObjectId);
  });

  it("maps new patient DTOs to case data and auto-archives out-of-day procedure cases", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T09:00:00.000Z"));

    const patientId = new Types.ObjectId();
    const masterCaseId = new Types.ObjectId();
    const userId = new Types.ObjectId().toString();
    const doctorUserId = new Types.ObjectId().toString();
    const nurseUserId = new Types.ObjectId().toString();

    const result = mapNewPatientDtoToCaseData(
      {
        caseId: "123-45",
        doctorUserId,
        nurseUserId,
        admission: {
          hospitalizationReason: "Observation",
        },
        patientSnapshot: {
          weightKg: 4.2,
        },
        flags: {
          isProcedure: true,
          isNPO: true,
        },
        dates: {
          procedureDate: "2026-04-24",
          catheterDate: "2026-04-22",
          nextInspectionDate: undefined,
          stitchesRemovalDate: null,
        },
        comments: "Needs monitoring",
        dailyPlan: {
          comments: "Call owner",
        },
        refs: {
          animalTypeId: new Types.ObjectId().toString(),
          foodTypeId: new Types.ObjectId().toString(),
        },
      } as never,
      patientId,
      masterCaseId,
      userId,
    );

    expect(result).toMatchObject({
      patientId,
      masterCaseId,
      serialId: "123-45",
      admission: {
        hospitalizationReason: "Observation",
      },
      patientSnapshot: {
        weightKg: 4.2,
      },
      flags: {
        isProcedure: true,
        isNPO: true,
      },
      comments: "Needs monitoring",
      dailyPlan: {
        comments: "Call owner",
      },
      isArchived: true,
    });
    expect(result.createdByUserId.toString()).toBe(userId);
    expect(result.doctorUserId?.toString()).toBe(doctorUserId);
    expect(result.nurseUserId?.toString()).toBe(nurseUserId);
    expect(result.dates?.procedureDate?.toISOString()).toBe(
      "2026-04-24T12:00:00.000Z",
    );
    expect(result.dates?.catheterDate?.toISOString()).toBe(
      "2026-04-22T12:00:00.000Z",
    );
    expect(result.dates).not.toHaveProperty("stitchesRemovalDate");
    expect(result.refs?.animalTypeId).toBeInstanceOf(Types.ObjectId);
    expect(result.refs?.foodTypeId).toBeInstanceOf(Types.ObjectId);
  });

  it("omits optional create fields and keeps same-day procedure cases active", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T09:00:00.000Z"));

    const result = mapNewPatientDtoToCaseData(
      {
        caseId: "555",
        flags: {
          isProcedure: true,
        },
        dates: {
          procedureDate: "2026-04-21",
        },
        comments: "",
      } as never,
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId().toString(),
    );

    expect(result.isArchived).toBe(false);
    expect(result).not.toHaveProperty("doctorUserId");
    expect(result).not.toHaveProperty("nurseUserId");
    expect(result).not.toHaveProperty("comments");
    expect(result).not.toHaveProperty("refs");
  });

  it("leaves non-procedure cases active and defaults missing procedure dates to today", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T09:00:00.000Z"));

    const nonProcedure = mapNewPatientDtoToCaseData(
      {
        caseId: "111",
        flags: {
          isProcedure: false,
        },
      } as never,
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId().toString(),
    );

    const missingProcedureDate = mapNewPatientDtoToCaseData(
      {
        caseId: "222",
        flags: {
          isProcedure: true,
        },
        dates: {},
      } as never,
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId().toString(),
    );

    expect(nonProcedure.isArchived).toBe(false);
    expect(missingProcedureDate.isArchived).toBe(false);
    expect(missingProcedureDate.dates?.procedureDate?.toISOString()).toBe(
      "2026-04-21T12:00:00.000Z",
    );
  });

  it("merges editable case updates, deletes nullable dates, and keeps manual procedure unarchive overrides", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T09:00:00.000Z"));

    const existingAnimalTypeId = new Types.ObjectId();
    const existingFoodTypeId = new Types.ObjectId();
    const nextGenderTypeId = new Types.ObjectId().toString();
    const doctorUserId = new Types.ObjectId().toString();
    const nurseUserId = new Types.ObjectId().toString();

    const existingCase = {
      admission: {
        hospitalizationReason: "Observation",
        referringDoctor: "Dr. A",
      },
      patientSnapshot: {
        weightKg: 4.2,
        ageYears: 2,
      },
      flags: {
        isProcedure: true,
        isNPO: false,
      },
      dates: {
        procedureDate: new Date("2026-04-24T12:00:00.000Z"),
        catheterDate: new Date("2026-04-20T12:00:00.000Z"),
      },
      dailyPlan: {
        comments: "Old comment",
        updatedAt: new Date("2026-04-20T09:00:00.000Z"),
      },
      refs: {
        animalTypeId: existingAnimalTypeId,
        foodTypeId: existingFoodTypeId,
      },
      isManuallyUnarchived: true,
      toObject() {
        return {
          admission: this.admission,
          patientSnapshot: this.patientSnapshot,
          flags: this.flags,
          dates: this.dates,
          dailyPlan: this.dailyPlan,
          refs: this.refs,
          isManuallyUnarchived: this.isManuallyUnarchived,
        };
      },
    };

    const result = mapEditDtoToCaseUpdate(
      {
        admission: {
          allergicComments: "Peanuts",
        },
        patientSnapshot: {
          ageMonths: 3,
        },
        flags: {
          isNPO: true,
        },
        dates: {
          catheterDate: null,
          nextInspectionDate: "2026-04-27",
        },
        doctorUserId,
        nurseUserId,
        comments: "",
        dailyPlan: {
          comments: "New comment",
        },
        refs: {
          genderTypeId: nextGenderTypeId,
        },
      } as never,
      existingCase as never,
    );

    expect(result.admission).toEqual({
      hospitalizationReason: "Observation",
      referringDoctor: "Dr. A",
      allergicComments: "Peanuts",
    });
    expect(result.patientSnapshot).toEqual({
      weightKg: 4.2,
      ageYears: 2,
      ageMonths: 3,
    });
    expect(result.flags).toEqual({
      isProcedure: true,
      isNPO: true,
    });
    expect(result.dates?.procedureDate?.toISOString()).toBe(
      "2026-04-24T12:00:00.000Z",
    );
    expect(result.dates).not.toHaveProperty("catheterDate");
    expect(result.dates?.nextInspectionDate?.toISOString()).toBe(
      "2026-04-27T12:00:00.000Z",
    );
    expect(result.doctorUserId?.toString()).toBe(doctorUserId);
    expect(result.nurseUserId?.toString()).toBe(nurseUserId);
    expect(result.comments).toBe("");
    expect(result.dailyPlan).toEqual({
      comments: "New comment",
      updatedAt: new Date("2026-04-21T09:00:00.000Z"),
    });
    expect(result.refs).toEqual({
      animalTypeId: existingAnimalTypeId,
      foodTypeId: existingFoodTypeId,
      genderTypeId: expect.any(Types.ObjectId),
    });
    expect(result.isManuallyUnarchived).toBe(true);
    expect(result.isArchived).toBe(false);
  });

  it("auto-archives edited procedure cases when no manual override remains", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T09:00:00.000Z"));

    const result = mapEditDtoToCaseUpdate(
      {
        comments: undefined,
      } as never,
      {
        flags: {
          isProcedure: true,
        },
        dates: {
          procedureDate: new Date("2026-04-25T12:00:00.000Z"),
        },
        isManuallyUnarchived: false,
      } as never,
    );

    expect(result).toEqual({
      isManuallyUnarchived: false,
      isArchived: true,
    });
  });

  it("defaults edited cases moved to procedures to today's procedure date", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T09:00:00.000Z"));

    const result = mapEditDtoToCaseUpdate(
      {
        flags: {
          isProcedure: true,
        },
      } as never,
      {
        flags: {
          isProcedure: false,
        },
        dates: {
          catheterDate: new Date("2026-04-20T12:00:00.000Z"),
        },
      } as never,
    );

    expect(result.flags).toEqual({
      isProcedure: true,
    });
    expect(result.dates?.catheterDate?.toISOString()).toBe(
      "2026-04-20T12:00:00.000Z",
    );
    expect(result.dates?.procedureDate?.toISOString()).toBe(
      "2026-04-21T12:00:00.000Z",
    );
    expect(result.isArchived).toBe(false);
  });
});
