import {
  buildClinicalCaseDetailItems,
  buildClinicalSummaryInput,
  hasClinicalSummaryContent,
  toJerusalemDateTime,
} from "../../src/services/clinicalSummary/clinicalSummary.input.js";

const populated = (name: string) => ({ _id: "507f1f77bcf86cd799439011", name });

describe("clinical summary input allowlist", () => {
  it("converts winter and daylight-saving timestamps to Jerusalem time", () => {
    expect(toJerusalemDateTime("2026-01-15T10:00:00.000Z")).toBe(
      "2026-01-15 12:00:00",
    );
    expect(toJerusalemDateTime("2026-07-15T10:00:00.000Z")).toBe(
      "2026-07-15 13:00:00",
    );
  });

  it("prefers the clinician-entered Jerusalem hour over a server-generated dateTime", () => {
    const input = buildClinicalSummaryInput({
      updatedAt: new Date(),
      caseDetailsGrid: [
        {
          date: "2026-08-01",
          time: "14:30",
          dateTime: "2026-08-01T14:30:00.000Z",
          temperature: 38.5,
          medicines: [{ medicineId: populated("תרופה"), isGiven: true }],
          fluids: [],
          examinations: [],
        },
      ],
    });
    expect(input.vitalSigns[0].recordedAt).toBe("2026-08-01 14:30:00");
    expect(input.treatments[0].scheduledAt).toBe("2026-08-01 14:30:00");
  });

  it("includes clinical fields and excludes identifying, document, photo, and nested forbidden fields", () => {
    const input = buildClinicalSummaryInput({
      _id: "case-id",
      patientId: {
        _id: "patient-id",
        name: "Milo",
        owner: { name: "Owner", phone: "0501234567", email: "x@y.test" },
        photoName: "photo.jpg",
      },
      createdAt: new Date("2026-01-01T10:00:00Z"),
      updatedAt: new Date("2026-01-02T10:00:00Z"),
      refs: {
        animalTypeId: populated("כלב"),
        genderTypeId: populated("זכר"),
        raceTypeId: populated("מעורב"),
      },
      patientSnapshot: { ageYears: 4, weightKg: 12.5 },
      admission: {
        hospitalizationReason: "הקאות",
        allergicComments: "פניצילין",
        bloodTestLink: "https://secret.test",
      },
      flags: { isAllergic: true, isRiskAnesthesia: true },
      documents: [{ signedUrl: "https://secret.test/document" }],
      caseDetailsGrid: [
        {
          dateTime: new Date("2026-01-02T09:00:00Z"),
          temperature: 39.1,
          pulse: 110,
          rowComments: "ערני",
          examinations: [{ typeId: populated("בדיקה כללית"), value: "יציב" }],
          medicines: [
            {
              medicineId: populated("תרופה א"),
              dosageText: "5 מ״ג",
              isGiven: true,
            },
          ],
          fluids: [],
        },
      ],
    });

    expect(input.patient).toEqual(
      expect.objectContaining({
        species: "כלב",
        breed: "מעורב",
        sex: "זכר",
        weightKg: 12.5,
      }),
    );
    expect(input.hospitalization.admittedAt).toBe("01/01/2026");
    expect(input.alerts.allergies).toEqual(["פניצילין"]);
    expect(input.alerts.anesthesiaRisks).toHaveLength(1);
    expect(input.treatments[0]).toEqual(
      expect.objectContaining({
        name: "תרופה א",
        administrationStatus: "received",
      }),
    );
    expect(input.currentStatus.latestExamination).toContain(
      "בדיקה כללית: יציב",
    );
    const serialized = JSON.stringify(input);
    for (const forbidden of [
      "Owner",
      "0501234567",
      "x@y.test",
      "case-id",
      "patient-id",
      "secret.test",
      "photo.jpg",
      "signedUrl",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(hasClinicalSummaryContent(input)).toBe(true);
  });

  it("deduplicates observations and retains latest vital signs while truncating long history", () => {
    const rows = Array.from({ length: 70 }, (_, index) => ({
      dateTime: new Date(Date.UTC(2026, 0, index + 1)),
      temperature: 38 + index / 100,
      rowComments: index >= 68 ? "אותה הערה" : `הערה ${index}`,
      medicines: [],
      fluids: [],
      examinations: [],
    }));
    const input = buildClinicalSummaryInput({
      updatedAt: new Date("2026-03-20T00:00:00Z"),
      caseDetailsGrid: rows,
    });
    expect(input.sourceMetadata.inputWasTruncated).toBe(true);
    expect(input.vitalSigns).toHaveLength(48);
    expect(input.vitalSigns[0].recordedAt).toBe("2026-03-11 02:00:00");
    expect(
      input.currentStatus.observations?.filter((item) => item === "אותה הערה"),
    ).toHaveLength(1);
  });

  it("distinguishes received medicine from medicine not yet recorded as received", () => {
    const input = buildClinicalSummaryInput({
      updatedAt: new Date(),
      caseDetailsGrid: [
        {
          dateTime: new Date(),
          medicines: [
            { medicineId: populated("פעילה"), isGiven: true },
            {
              medicineId: populated("נדרשת"),
              isGiven: false,
              isRequired: true,
            },
            {
              medicineId: populated("אופציונלית"),
              isGiven: false,
              isRequired: false,
            },
          ],
          fluids: [],
          examinations: [],
        },
      ],
    });
    expect(input.treatments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "פעילה",
          administrationStatus: "received",
        }),
        expect.objectContaining({
          name: "נדרשת",
          administrationStatus: "not_received_yet",
        }),
      ]),
    );
    expect(input.treatments.some((item) => item.name === "אופציונלית")).toBe(
      false,
    );
    expect(input.treatments.every((item) => !("status" in item))).toBe(true);
  });

  it("keeps every case-detail occurrence and the exact checked state", () => {
    const items = buildClinicalCaseDetailItems(
      {
        caseDetailsGrid: [
          {
            date: "2026-08-01",
            time: "14:30",
            medicines: [
              {
                medicineId: populated("תרופה א"),
                dosageText: "5 mg",
                isGiven: true,
              },
              {
                medicineId: populated("תרופה א"),
                dosageText: "10 mg",
                isGiven: false,
                isRequired: true,
              },
              {
                medicineId: populated("תרופה אופציונלית"),
                isGiven: false,
                isRequired: false,
              },
            ],
            fluids: [
              {
                medicineId: populated("נוזלים"),
                isGiven: true,
                comment: "100 ml",
              },
            ],
            procedures: [
              { typeId: populated("חבישה"), isGiven: false, isRequired: true },
            ],
            foodExtras: [{ typeId: populated("מזון רפואי"), isGiven: true }],
            examinations: [
              {
                typeId: populated("בדיקה כללית"),
                value: "תקין",
                comment: "ערני",
              },
              {
                typeId: populated("בדיקת חובה חסרה"),
                isRequired: true,
              },
              {
                typeId: populated("בדיקה אופציונלית חסרה"),
                isRequired: false,
              },
            ],
            temperatureIsRequired: true,
            foodGiven: true,
            waterGiven: false,
            isBoxClean: true,
          },
        ],
      },
      "2026-08-01",
    );

    expect(items.filter((item) => item.category === "medicine")).toHaveLength(
      2,
    );
    expect(items.some((item) => item.name === "תרופה אופציונלית")).toBe(false);
    expect(items.some((item) => item.name === "בדיקה אופציונלית חסרה")).toBe(
      false,
    );
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "medicine",
          name: "תרופה א",
          dosage: "5 mg",
          status: "received",
          scheduledAt: "2026-08-01 14:30:00",
        }),
        expect.objectContaining({
          category: "medicine",
          name: "תרופה א",
          dosage: "10 mg",
          status: "not_received_yet",
        }),
        expect.objectContaining({
          category: "fluid",
          name: "נוזלים",
          status: "received",
          comment: "100 ml",
        }),
        expect.objectContaining({
          category: "procedure",
          name: "חבישה",
          status: "not_received_yet",
        }),
        expect.objectContaining({
          category: "food_extra",
          name: "מזון רפואי",
          status: "received",
        }),
        expect.objectContaining({
          category: "examination",
          value: "תקין",
          comment: "ערני",
          status: "recorded",
        }),
        expect.objectContaining({
          category: "care",
          name: "אוכל",
          status: "recorded",
        }),
        expect.objectContaining({
          category: "examination",
          name: "בדיקת חובה חסרה",
          status: "not_received_yet",
        }),
        expect.objectContaining({
          category: "care",
          name: "טמפרטורה",
          status: "not_received_yet",
        }),
      ]),
    );
    expect(items.some((item) => item.name === "מים")).toBe(false);
  });

  it("keeps clinical alerts separate and does not invent an allergy", () => {
    const input = buildClinicalSummaryInput({
      updatedAt: new Date(),
      admission: {},
      flags: {
        isAllergic: false,
        isRiskAnesthesia: true,
        isEscapePotential: true,
        isNPO: true,
        isHeartMurmur: true,
        isAggressive: true,
        isAMB: true,
        isCerenia: true,
        isConvenia: true,
      },
      caseDetailsGrid: [],
    });
    expect(input.alerts.allergies).toBeUndefined();
    expect(input.alerts.anesthesiaRisks).toEqual(["סיכון הרדמה מסומן ברשומה"]);
    expect(input.alerts.other).toEqual(
      expect.arrayContaining([
        "פוטנציאל בריחה",
        "בצום (NPO)",
        "אוושה לבבית",
        "התנהגות אגרסיבית",
        "AMB מסומן ברשומה",
        "Cerenia מסומן ברשומה",
        "Convenia מסומן ברשומה",
      ]),
    );
  });
});
