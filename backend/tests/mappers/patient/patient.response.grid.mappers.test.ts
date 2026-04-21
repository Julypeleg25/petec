import { Types } from "mongoose";
import {
  groupCaseDetailsRows,
  mapGridRowToDto,
} from "../../../src/mappers/patient/patient.response.grid.mappers.js";

describe("patient.response.grid.mappers", () => {
  it("maps grid rows to DTOs and filters invalid medicine references", () => {
    const rowId = new Types.ObjectId();
    const validMedicineId = new Types.ObjectId();
    const measureUnitId = new Types.ObjectId();
    const dosageFrequencyId = new Types.ObjectId();
    const routeId = new Types.ObjectId();

    const result = mapGridRowToDto(
      {
        _id: rowId,
        index: 5,
        date: "2026-04-21",
        time: "9:15",
        temperature: 38.5,
        temperatureIsRequired: true,
        temperatureIsEditable: false,
        pulse: 80,
        pulseIsRequired: false,
        pulseIsEditable: true,
        respiration: 22,
        respirationIsRequired: true,
        respirationIsEditable: false,
        fluids: [
          {
            medicineId: { _id: validMedicineId, name: "Saline" },
            dosageText: "1 ml",
            doseAmount: "2.5",
            measureUnitTypeId: { _id: measureUnitId, name: "ml" },
            dosageFrequencyId: { _id: dosageFrequencyId, name: "BID" },
            routeOfAdministrationId: { _id: routeId, name: "PO" },
            isGiven: true,
            isRequired: true,
            isEditable: false,
            comment: "ok",
          },
        ],
        medicines: [
          {
            medicineId: "not-an-object-id",
            isGiven: true,
            isRequired: false,
            isEditable: true,
          },
        ],
        procedures: [
          {
            typeId: { _id: "proc-1", name: "Walk" },
            isGiven: false,
            isRequired: true,
            isEditable: false,
            comment: "monitor",
          },
        ],
        foodExtras: [
          {
            typeId: { _id: "food-1", name: "Treat" },
            isGiven: true,
            isRequired: false,
            isEditable: true,
            comment: "bonus",
          },
        ],
        examinations: [
          {
            typeId: { _id: "exam-1", name: "CRT" },
            value: "2 sec",
            isRequired: true,
            isEditable: false,
            comment: "watch",
          },
        ],
        foodGiven: true,
        waterGiven: false,
        foodAndWater: "fed",
        foodAndWaterIsRequired: true,
        foodAndWaterIsEditable: false,
        urineTypeId: "urine-1",
        urineComments: "clear",
        urineIsRequired: true,
        urineIsEditable: false,
        fecesTypeId: "feces-1",
        fecesComments: "normal",
        fecesIsRequired: false,
        fecesIsEditable: true,
        isBoxClean: true,
        isBoxCleanIsRequired: false,
        isBoxCleanIsEditable: true,
        isRelease: null,
        isReleaseIsRequired: true,
        isReleaseIsEditable: false,
        isTravel: true,
        isTravelIsRequired: false,
        isTravelIsEditable: true,
        isPuke: false,
        pukeComments: "none",
        pukeIsRequired: true,
        pukeIsEditable: false,
        weigh: 4.2,
        weighIsRequired: true,
        weighIsEditable: false,
        rowComments: "stable",
        rowCommentsIsRequired: true,
        rowCommentsIsEditable: false,
        ownerUpdate: "called owner",
        ownerUpdateIsRequired: false,
        ownerUpdateIsEditable: true,
      } as never,
      2,
    );

    expect(result.id).toBe(rowId.toString());
    expect(result.time).toBe("09:15");
    expect(result.temperature).toBe("38.5");
    expect(result.fluids).toEqual([
      {
        medicineId: validMedicineId.toString(),
        value: validMedicineId.toString(),
        text: "Saline",
        isGiven: true,
        isRequired: true,
        isEditable: false,
        dosageText: "1 ml",
        doseAmount: 2.5,
        measureUnitType: {
          id: measureUnitId.toString(),
          name: "ml",
        },
        dosageFrequency: {
          id: dosageFrequencyId.toString(),
          name: "BID",
        },
        routeOfAdministration: {
          id: routeId.toString(),
          name: "PO",
        },
        comment: "ok",
      },
    ]);
    expect(result.medicines).toEqual([]);
    expect(result.procedures[0]).toEqual({
      value: "proc-1",
      text: "Walk",
      isGiven: false,
      isRequired: true,
      isEditable: false,
      comment: "monitor",
    });
    expect(result.examinations[0]).toEqual({
      value: "exam-1",
      text: "CRT",
      exam_value: "2 sec",
      isRequired: true,
      isEditable: false,
      comment: "watch",
    });
    expect(result.urineTypeId).toBe("urine-1");
    expect(result.isRelease).toBeNull();
    expect(result.weigh).toBe("4.2");
  });

  it("groups case rows by normalized date, sorts times, and moves unknown dates last", () => {
    const olderRow = {
      _id: new Types.ObjectId(),
      dateTime: new Date("2026-04-20T08:00:00.000Z"),
      index: 3,
    };
    const laterTimeRow = {
      _id: new Types.ObjectId(),
      date: "2026-04-21",
      time: "12:00",
      index: 2,
    };
    const earlierTimeRow = {
      _id: new Types.ObjectId(),
      date: "2026-04-21",
      time: "08:00",
      index: 1,
    };
    const unknownDateRow = {
      _id: new Types.ObjectId(),
      index: 4,
    };

    const grouped = groupCaseDetailsRows([
      unknownDateRow,
      laterTimeRow,
      olderRow,
      earlierTimeRow,
    ] as never);

    expect(grouped).toHaveLength(3);
    expect(grouped[0]).toEqual([olderRow]);
    expect(grouped[1]).toEqual([earlierTimeRow, laterTimeRow]);
    expect(grouped[2]).toEqual([unknownDateRow]);
  });
});
