import { ROUTES } from "@petec/shared";
import { jest } from "@jest/globals";
import { Types } from "mongoose";
import {
  compareDailyPlanRowsDesc,
  isPhotoStorageKey,
  mapCaseToChartsDataResponse,
  mapCaseToDailyPlanDetail,
  mapRelatedCasesToMasterCaseDetails,
  toPhotoContentType,
} from "../../../src/mappers/patient/patient.service.mappers.js";

describe("patient.service.mappers", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("detects photo storage keys and resolves content types", () => {
    expect(isPhotoStorageKey("patients/photos/cat.png")).toBe(true);
    expect(isPhotoStorageKey("https://cdn.example.com/cat.png")).toBe(true);
    expect(isPhotoStorageKey("patients/documents/report.pdf")).toBe(false);

    expect(toPhotoContentType("patients/photos/cat.png")).toBe("image/png");
    expect(toPhotoContentType("patients/photos/cat.gif")).toBe("image/gif");
    expect(toPhotoContentType("patients/photos/cat.unknown")).toBe("image/jpeg");
  });

  it("maps related cases to master case details with populated and raw patients", () => {
    const patientId = new Types.ObjectId();
    const updatedAt = new Date("2026-04-22T00:00:00.000Z");

    const result = mapRelatedCasesToMasterCaseDetails([
      {
        _id: new Types.ObjectId(),
        createdAt: new Date("2026-04-21T00:00:00.000Z"),
        patientId: {
          _id: patientId,
          name: "Milo",
          photoName: "avatar.png",
          updatedAt,
        },
      },
      {
        _id: new Types.ObjectId(),
        createdAt: "2026-04-21",
        patientId: new Types.ObjectId(),
      },
    ] as never);

    expect(result[0]).toEqual({
      caseId: expect.any(String),
      patientName: "Milo",
      patientPhotoName: `${ROUTES.PATIENT}/photo/${patientId.toString()}?v=${updatedAt.getTime()}`,
      createdAt: "2026-04-21T00:00:00.000Z",
    });
    expect(result[1]).toEqual({
      caseId: expect.any(String),
      patientName: "",
      patientPhotoName: null,
      createdAt: null,
    });
  });

  it("ignores patient-like objects that do not expose an id", () => {
    const result = mapRelatedCasesToMasterCaseDetails([
      {
        _id: new Types.ObjectId(),
        createdAt: new Date("2026-04-21T00:00:00.000Z"),
        patientId: {
          name: "Ghost",
          photoName: "ghost.png",
        },
      },
    ] as never);

    expect(result).toEqual([
      {
        caseId: expect.any(String),
        patientName: "",
        patientPhotoName: null,
        createdAt: "2026-04-21T00:00:00.000Z",
      },
    ]);
  });

  it("maps chart series and calculates min/max from numeric values", () => {
    const result = mapCaseToChartsDataResponse({
      caseDetailsGrid: [
        {
          date: "2026-04-21",
          time: "08:00",
          temperature: 38.4,
          pulse: 80,
          respiration: null,
          weigh: "4.1",
        },
        {
          dateTime: new Date("2026-04-22T10:30:00.000Z"),
          temperature: undefined,
          pulse: "82",
          respiration: 21.6,
          weigh: 4.9,
        },
      ],
    } as never);

    expect(result.temperature).toEqual([
      { name: "08:00 21/04/2026", value: 38.4 },
    ]);
    expect(result.pulse).toEqual([
      { name: "08:00 21/04/2026", value: 80 },
      { name: "13:30 22/04/2026", value: 82 },
    ]);
    expect(result.respiration).toEqual([
      { name: "13:30 22/04/2026", value: 21.6 },
    ]);
    expect(result.weight).toEqual([
      { name: "08:00 21/04/2026", value: 4.1 },
      { name: "13:30 22/04/2026", value: 4.9 },
    ]);
    expect(result.dataMin).toBe(4);
    expect(result.dataMax).toBe(82);
  });

  it("returns chart defaults when no numeric chart points exist", () => {
    expect(
      mapCaseToChartsDataResponse({
        caseDetailsGrid: [{ date: "2026-04-21", time: "08:00" }],
      } as never),
    ).toEqual({
      temperature: [],
      pulse: [],
      respiration: [],
      weight: [],
      dataMin: 0,
      dataMax: 100,
    });
  });

  it("uses fallback point labels when chart rows do not expose a display date", () => {
    expect(
      mapCaseToChartsDataResponse({
        caseDetailsGrid: [{ pulse: 12 }],
      } as never),
    ).toEqual({
      temperature: [],
      pulse: [{ name: "Point 1", value: 12 }],
      respiration: [],
      weight: [],
      dataMin: 12,
      dataMax: 12,
    });
  });

  it("maps daily plan details for rows on the current Jerusalem date", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T09:00:00.000Z"));

    const result = mapCaseToDailyPlanDetail({
      _id: new Types.ObjectId(),
      serialId: "123-45",
      patientId: {
        name: "Milo",
        owner: {
          name: "Dana",
          phone: "0501234567",
        },
      },
      admission: {
        hospitalizationReason: "Observation",
      },
      dailyPlan: {
        updatedAt: "2026-04-21T08:00:00.000Z",
        comments: "call owner at noon",
      },
      caseDetailsGrid: [
        {
          date: "2026-04-21",
          time: "10:00",
          index: 1,
          procedures: [
            {
              typeId: { _id: "proc-1", name: "Walk" },
              isGiven: true,
              isRequired: false,
            },
          ],
          examinations: [
            {
              typeId: { _id: "exam-1", name: "CRT" },
              value: "2 sec",
              isRequired: false,
            },
          ],
          ownerUpdate: "owner updated",
          ownerUpdateIsRequired: false,
          isRelease: true,
          isReleaseIsRequired: false,
        },
        {
          date: "2026-04-21",
          time: "08:00",
          index: 2,
          procedures: [
            {
              typeId: { _id: "proc-2", name: "Bandage" },
              isGiven: false,
              isRequired: true,
            },
          ],
          examinations: [
            {
              typeId: { _id: "exam-2", name: "Temp" },
              value: " ",
              isRequired: true,
            },
          ],
          ownerUpdate: " ",
          ownerUpdateIsRequired: true,
          isRelease: false,
          isReleaseIsRequired: true,
        },
        {
          date: "2026-04-22",
          time: "09:00",
          procedures: [
            {
              typeId: { _id: "proc-3", name: "Ignore future" },
              isGiven: true,
            },
          ],
        },
        {
          date: "2026-04-20",
          time: "07:00",
          examinations: [
            {
              typeId: { _id: "exam-3", name: "Ignore past" },
              value: "ignored",
              isRequired: true,
            },
          ],
        },
      ],
    } as never);

    expect(result).toEqual({
      case_id: expect.any(String),
      master_case_id: "123",
      serial_id: "123-45",
      name: "Milo",
      owner_name: "Dana",
      owner_phone_number: "0501234567",
      hospitalization_reason: "Observation",
      daily_plan_comments: "call owner at noon",
      caseExaminations: [
        {
          name: "CRT",
          value: "2 sec",
          date: "10:00 21/04/2026",
        },
        {
          name: "Temp",
          value: "",
          date: "08:00 21/04/2026",
        },
      ],
      caseProcedures: [
        {
          name: "Ignore future",
          value: true,
          date: "09:00 22/04/2026",
        },
        {
          name: "Walk",
          value: true,
          date: "10:00 21/04/2026",
        },
        {
          name: "Bandage",
          value: false,
          date: "08:00 21/04/2026",
        },
      ],
      ownerUpdate: [
        {
          value: "owner updated",
          date: "10:00 21/04/2026",
        },
        {
          value: "",
          date: "08:00 21/04/2026",
        },
      ],
      releaseMedicines: [
        {
          value: true,
          date: "10:00 21/04/2026",
        },
        {
          value: false,
          date: "08:00 21/04/2026",
        },
      ],
      is_procedure: false,
    });
  });

  it("falls back when patient details are not populated or comments are stale", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T09:00:00.000Z"));

    expect(
      mapCaseToDailyPlanDetail({
        _id: new Types.ObjectId(),
        serialId: "999",
        patientId: new Types.ObjectId(),
        dailyPlan: {
          updatedAt: "2026-04-20T08:00:00.000Z",
          comments: "old comment",
        },
        caseDetailsGrid: [],
      } as never),
    ).toEqual({
      case_id: expect.any(String),
      master_case_id: "999",
      serial_id: "999",
      name: "",
      owner_name: "",
      owner_phone_number: "",
      hospitalization_reason: "",
      daily_plan_comments: null,
      caseExaminations: [],
      caseProcedures: [],
      ownerUpdate: [],
      releaseMedicines: [],
      is_procedure: false,
    });
  });

  it("sorts same-time daily-plan rows by descending index", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-21T09:00:00.000Z"));

    const result = mapCaseToDailyPlanDetail({
      _id: new Types.ObjectId(),
      serialId: "555-1",
      patientId: {
        name: "Milo",
        owner: {
          name: "Dana",
          phone: "0501234567",
        },
      },
      caseDetailsGrid: [
        {
          date: "2026-04-21",
          time: "10:00",
          index: 1,
          procedures: [
            {
              typeId: { _id: "proc-1", name: "Lower" },
              isGiven: true,
            },
          ],
        },
        {
          date: "2026-04-21",
          time: "10:00",
          index: 3,
          procedures: [
            {
              typeId: { _id: "proc-2", name: "Higher" },
              isGiven: true,
            },
          ],
        },
      ],
    } as never);

    expect(result.caseProcedures).toEqual([
      {
        name: "Higher",
        value: true,
        date: "10:00 21/04/2026",
      },
      {
        name: "Lower",
        value: true,
        date: "10:00 21/04/2026",
      },
    ]);
  });

  it("compares daily-plan rows by date before falling back to time and index", () => {
    expect(
      compareDailyPlanRowsDesc(
        {
          date: "2026-04-21",
          time: "10:00",
          index: 1,
        } as never,
        {
          date: "2026-04-22",
          time: "08:00",
          index: 99,
        } as never,
      ),
    ).toBeGreaterThan(0);
  });
});
