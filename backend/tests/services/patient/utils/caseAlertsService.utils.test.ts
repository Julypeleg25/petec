import { Types } from "mongoose";
import {
  CASE_ALERT_FIELDS,
  CASE_ALERT_RULES,
  CASE_ALERTS_CONSTANTS,
} from "../../../../src/constants/caseAlerts.constants.js";
import {
  getCaseAnimalTypeId,
  buildCaseAlertSummary,
} from "../../../../src/services/patient/utils/caseAlertsService.utils.js";
import { ANIMAL_VITAL_TYPES } from "../../../../src/utils/animalVitals.utils.js";

describe("caseAlertsService.utils", () => {
  it("builds alert summaries for required fields, vitals, and catheter reminders", () => {
    const requiredRowId = new Types.ObjectId();
    const recentDate = new Date("2026-04-21T06:00:00.000Z");
    const now = new Date("2026-04-21T09:00:00.000Z");

    const summary = buildCaseAlertSummary(
      {
        caseDetailsGrid: [
          {
            _id: requiredRowId,
            dateTime: recentDate,
            fluids: [{ isEditable: true, isRequired: true, isGiven: false }],
            medicines: [{ isEditable: true, isRequired: true, isGiven: false }],
            examinations: [{ isEditable: true, isRequired: true, value: "   " }],
            foodExtras: [{ isEditable: true, isRequired: true, isGiven: false }],
            temperatureIsEditable: true,
            temperatureIsRequired: true,
            temperature: null,
            pulseIsEditable: true,
            pulseIsRequired: true,
            pulse: null,
            respirationIsEditable: true,
            respirationIsRequired: true,
            respiration: null,
            urineIsEditable: true,
            urineIsRequired: true,
            urineTypeId: null,
            fecesIsEditable: true,
            fecesIsRequired: true,
            fecesTypeId: null,
            isBoxCleanIsEditable: true,
            isBoxCleanIsRequired: true,
            isBoxClean: null,
            isReleaseIsEditable: true,
            isReleaseIsRequired: true,
            isRelease: null,
            isTravelIsEditable: true,
            isTravelIsRequired: true,
            isTravel: null,
            pukeIsEditable: true,
            pukeIsRequired: true,
            isPuke: null,
            weighIsEditable: true,
            weighIsRequired: true,
            weigh: null,
            foodAndWaterIsEditable: true,
            foodAndWaterIsRequired: true,
            foodAndWater: " ",
            ownerUpdateIsEditable: true,
            ownerUpdateIsRequired: true,
            ownerUpdate: " ",
            rowCommentsIsEditable: true,
            rowCommentsIsRequired: true,
            rowComments: " ",
          },
          {
            _id: new Types.ObjectId(),
            dateTime: new Date("2026-04-21T07:00:00.000Z"),
            temperature: 41,
            pulse: 40,
            respiration: 8,
            fluids: [],
            medicines: [],
            examinations: [],
            foodExtras: [],
          },
        ],
        dates: {
          catheterDate: new Date("2026-04-18T08:00:00.000Z"),
        },
      } as never,
      {
        [ANIMAL_VITAL_TYPES.TEMPERATURE]: { rangeMin: 37, rangeMax: 39 },
        [ANIMAL_VITAL_TYPES.PULSE]: { rangeMin: 60, rangeMax: 100 },
        [ANIMAL_VITAL_TYPES.RESPIRATION]: { rangeMin: 15, rangeMax: 30 },
      } as never,
      now,
    );

    expect(summary.total).toBe(21);

    const alertPairs = summary.alerts.map((alert) => `${alert.rule}:${alert.field}`);

    expect(alertPairs).toEqual(
      expect.arrayContaining([
        `${CASE_ALERT_RULES.REQUIRED_MEDICATION_MISSING}:${CASE_ALERT_FIELDS.FLUID}`,
        `${CASE_ALERT_RULES.REQUIRED_MEDICATION_MISSING}:${CASE_ALERT_FIELDS.MEDICINE}`,
        `${CASE_ALERT_RULES.REQUIRED_EXAMINATION_MISSING}:${CASE_ALERT_FIELDS.EXAMINATION}`,
        `${CASE_ALERT_RULES.REQUIRED_FOOD_EXTRA_MISSING}:${CASE_ALERT_FIELDS.FOOD_EXTRA}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.TEMPERATURE}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.PULSE}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.RESPIRATION}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.URINE_TYPE_ID}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.FECES_TYPE_ID}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.IS_BOX_CLEAN}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.IS_RELEASE}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.IS_TRAVEL}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.IS_PUKE}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.WEIGH}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.FOOD_AND_WATER}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.OWNER_UPDATE}`,
        `${CASE_ALERT_RULES.REQUIRED_FIELD_MISSING}:${CASE_ALERT_FIELDS.ROW_COMMENTS}`,
        `${CASE_ALERT_RULES.VITAL_OUT_OF_RANGE}:${CASE_ALERT_FIELDS.TEMPERATURE}`,
        `${CASE_ALERT_RULES.VITAL_OUT_OF_RANGE}:${CASE_ALERT_FIELDS.PULSE}`,
        `${CASE_ALERT_RULES.VITAL_OUT_OF_RANGE}:${CASE_ALERT_FIELDS.RESPIRATION}`,
        `${CASE_ALERT_RULES.CATHETER_REMINDER}:${CASE_ALERT_FIELDS.CATHETER_DATE}`,
      ]),
    );

    const catheterAlert = summary.alerts.find(
      (alert) => alert.rule === CASE_ALERT_RULES.CATHETER_REMINDER,
    );
    expect(catheterAlert).toMatchObject({
      rowId: CASE_ALERTS_CONSTANTS.UNKNOWN_ROW_ID,
    });

    const missingTemperatureAlert = summary.alerts.find(
      (alert) =>
        alert.rule === CASE_ALERT_RULES.REQUIRED_FIELD_MISSING &&
        alert.field === CASE_ALERT_FIELDS.TEMPERATURE,
    );
    expect(missingTemperatureAlert?.rowId).toBe(requiredRowId.toString());
    expect(missingTemperatureAlert?.dateTime?.toISOString()).toBe(
      recentDate.toISOString(),
    );
  });

  it("ignores stale rows and in-range vitals outside the reminder window", () => {
    const summary = buildCaseAlertSummary(
      {
        caseDetailsGrid: [
          {
            _id: new Types.ObjectId(),
            dateTime: new Date("2026-04-19T04:00:00.000Z"),
            temperatureIsEditable: true,
            temperatureIsRequired: true,
            temperature: null,
            fluids: [{ isEditable: true, isRequired: true, isGiven: false }],
            medicines: [],
            examinations: [],
            foodExtras: [],
          },
          {
            _id: new Types.ObjectId(),
            dateTime: new Date("2026-04-21T07:00:00.000Z"),
            temperature: 38,
            pulse: 75,
            respiration: 22,
            fluids: [],
            medicines: [],
            examinations: [],
            foodExtras: [],
          },
        ],
        dates: {
          catheterDate: new Date("2026-04-17T08:00:00.000Z"),
        },
      } as never,
      {
        [ANIMAL_VITAL_TYPES.TEMPERATURE]: { rangeMin: 37, rangeMax: 39 },
        [ANIMAL_VITAL_TYPES.PULSE]: { rangeMin: 60, rangeMax: 100 },
        [ANIMAL_VITAL_TYPES.RESPIRATION]: { rangeMin: 15, rangeMax: 30 },
      } as never,
      new Date("2026-04-21T09:00:00.000Z"),
    );

    expect(summary).toEqual({
      total: 0,
      alerts: [],
    });
  });

  it("resolves animal type ids from case refs, patient refs, or falls back to empty", () => {
    expect(
      getCaseAnimalTypeId({
        refs: { animalTypeId: "animal-from-case" },
      } as never),
    ).toBe("animal-from-case");

    expect(
      getCaseAnimalTypeId({
        patientId: { refs: { animalTypeId: "animal-from-patient" } },
      } as never),
    ).toBe("animal-from-patient");

    expect(getCaseAnimalTypeId({} as never)).toBe("");
  });
});
