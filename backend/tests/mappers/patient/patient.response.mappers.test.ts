import { DEFAULT_PATIENT_IMAGE } from "@petec/shared";
import { Types } from "mongoose";
import {
  toAnesthesiaFormDTO,
  toCaseDetailsResponseDTO,
  toPatientDocumentResponseDTO,
  toReleasePatientDataResponseDTO,
  withMasterCaseDetails,
} from "../../../src/mappers/patient/patient.response.mappers.js";

describe("patient.response.mappers", () => {
  it("maps patient documents into response DTOs", () => {
    const patientId = new Types.ObjectId();
    const documentTypeId = new Types.ObjectId();
    const uploaderId = new Types.ObjectId();

    expect(
      toPatientDocumentResponseDTO({
        _id: new Types.ObjectId(),
        patientId,
        caseId: null,
        patientDocumentTypeId: documentTypeId,
        fileName: "lab.pdf",
        storageKey: "patients/docs/lab.pdf",
        uploadedByUserId: uploaderId,
        uploadedAt: new Date("2026-04-21T08:00:00.000Z"),
      } as never),
    ).toEqual({
      id: expect.any(String),
      patientId: patientId.toString(),
      caseId: undefined,
      patientDocumentTypeId: documentTypeId.toString(),
      fileName: "lab.pdf",
      storageKey: "patients/docs/lab.pdf",
      fileUrl: "patients/docs/lab.pdf",
      uploadedByUserId: uploaderId.toString(),
      uploadedAt: "2026-04-21T08:00:00.000Z",
    });
  });

  it("maps anesthesia forms while omitting non-boolean and non-string optionals", () => {
    const caseId = new Types.ObjectId();
    const date = new Date("2026-04-21T00:00:00.000Z");

    expect(
      toAnesthesiaFormDTO({
        caseId,
        ownerName: "Dana",
        name: "Milo",
        date,
        signature: "signed",
        plannedProcedure: "Dental cleaning",
        priceEstimate: "450",
        isFastSinceMidnight: true,
        isDistortionHistory: false,
        isMedicationsSensitive: null,
        isNeedToMarkEar: true,
        isSterilization: false,
        isPriceIncludesReleaseMedications: true,
        generalComments: "NPO from midnight",
        distortionComments: null,
        medicationsSensitiveComments: "Sensitive to ketamine",
      } as never),
    ).toEqual({
      caseId: caseId.toString(),
      ownerName: "Dana",
      name: "Milo",
      date,
      signature: "signed",
      plannedProcedure: "Dental cleaning",
      priceEstimate: "450",
      isFastSinceMidnight: true,
      isDistortionHistory: false,
      isMedicationsSensitive: undefined,
      isNeedToMarkEar: true,
      isSterilization: false,
      isPriceIncludesReleaseMedications: true,
      generalComments: "NPO from midnight",
      distortionComments: undefined,
      medicationsSensitiveComments: "Sensitive to ketamine",
    });
  });

  it("maps populated case details and groups daily rows", () => {
    const caseId = new Types.ObjectId();
    const patientId = new Types.ObjectId();
    const doctorId = new Types.ObjectId();
    const nurseId = new Types.ObjectId();

    const response = toCaseDetailsResponseDTO({
      _id: caseId,
      serialId: " ",
      patientId: {
        _id: patientId,
        name: "Milo",
        owner: {
          name: "Dana",
          phone: "0501234567",
        },
        refs: {
          animalTypeId: "animal-1",
          raceTypeId: "race-1",
          animalColorId: "color-1",
          insuranceTypeId: "insurance-1",
          foodTypeId: "food-1",
        },
      },
      refs: {
        genderTypeId: "gender-1",
      },
      admission: {
        referringDoctor: "Dr. Cohen",
        hospitalizationReason: "Observation",
        allergicComments: "Peanuts",
        bloodTestLink: "https://example.com/blood",
      },
      comments: "Needs monitoring",
      patientSnapshot: {
        weightKg: 4.2,
        ageYears: 2,
        ageMonths: 3,
      },
      dates: {
        catheterDate: "2026-04-21T00:00:00.000Z",
        procedureDate: "2026-04-22T00:00:00.000Z",
      },
      isArchived: true,
      doctorUserId: doctorId,
      nurseUserId: nurseId,
      flags: {
        isConvenia: true,
        isAllergic: false,
        isEscapePotential: true,
        isNPO: false,
        isRiskAnesthesia: true,
        isHeartMurmur: false,
        isAMB: true,
        isAggressive: false,
        isCerenia: true,
        isProcedure: false,
      },
      releaseDate: new Date("2026-04-23T00:00:00.000Z"),
      caseDetailsGrid: [
        {
          _id: new Types.ObjectId(),
          date: "2026-04-21",
          time: "10:00",
          index: 2,
          fluids: [],
          medicines: [],
          procedures: [],
          foodExtras: [],
          examinations: [],
        },
        {
          _id: new Types.ObjectId(),
          date: "2026-04-21",
          time: "08:00",
          index: 1,
          fluids: [],
          medicines: [],
          procedures: [],
          foodExtras: [],
          examinations: [],
        },
      ],
    } as never);

    expect(response.caseDetails).toMatchObject({
      name: "Milo",
      owner_name: "Dana",
      owner_phone_number: "0501234567",
      referring_doctor: "Dr. Cohen",
      comments: "Needs monitoring",
      hospitalization_reason: "Observation",
      allergic_comments: "Peanuts",
      weight_kg: 4.2,
      age_years: 2,
      age_months: 3,
      blood_test_link: "https://example.com/blood",
      is_archived: true,
      gender_type_id: "gender-1",
      animal_type_id: "animal-1",
      animal_color_id: "color-1",
      insurance_id: "insurance-1",
      food_type_id: "food-1",
      race_id: "race-1",
      doctor_id: doctorId.toString(),
      nurse_id: nurseId.toString(),
      is_convenia: true,
      is_escape_potential: true,
      is_risk_anesthesia: true,
      is_amb: true,
      is_cerenia: true,
      is_released: true,
      photo_name: DEFAULT_PATIENT_IMAGE,
      patient_id: patientId.toString(),
      serial_id: caseId.toString(),
    });
    expect(response.caseDailyDetails).toHaveLength(1);
    expect(response.caseDailyDetails?.[0]?.map((row) => row.time)).toEqual([
      "08:00",
      "10:00",
    ]);
    expect(response.masterCaseDetails).toEqual([]);
  });

  it("returns null daily details when there is no populated patient or grid", () => {
    const response = toCaseDetailsResponseDTO({
      _id: new Types.ObjectId(),
      serialId: "CASE-9",
      patientId: new Types.ObjectId(),
      refs: {
        animalTypeId: "animal-9",
      },
      isArchived: false,
      caseDetailsGrid: [],
    } as never);

    expect(response.caseDetails.name).toBe("");
    expect(response.caseDetails.animal_type_id).toBe("animal-9");
    expect(response.caseDetails.photo_name).toBe(DEFAULT_PATIENT_IMAGE);
    expect(response.caseDetails.serial_id).toBe("CASE-9");
    expect(response.caseDailyDetails).toBeNull();
  });

  it("adds master case details to an existing case response", () => {
    expect(
      withMasterCaseDetails(
        {
          caseDetails: { serial_id: "CASE-1" },
          caseDailyDetails: null,
          masterCaseDetails: [],
        } as never,
        [
          {
            caseId: "related-1",
            patientName: "Luna",
            patientPhotoName: "/patient/photo/1",
            createdAt: "2026-04-21T00:00:00.000Z",
          },
        ],
      ),
    ).toEqual({
      caseDetails: { serial_id: "CASE-1" },
      caseDailyDetails: null,
      masterCaseDetails: [
        {
          caseId: "related-1",
          patientName: "Luna",
          patientPhotoName: "/patient/photo/1",
          createdAt: "2026-04-21T00:00:00.000Z",
        },
      ],
    });
  });

  it("maps release patient data with populated and fallback medicine references", () => {
    const response = toReleasePatientDataResponseDTO(
      {
        releaseDate: "2026-04-24T00:00:00.000Z",
        dates: {
          stitchesRemovalDate: "2026-04-27T00:00:00.000Z",
          nextInspectionDate: "2026-04-30T00:00:00.000Z",
        },
      } as never,
      [
        {
          medicineId: {
            _id: "med-1",
            name: "Carprofen",
            measureUnitTypeId: {
              _id: "unit-1",
              name: "mg",
            },
            rangeMin: "1",
            rangeMax: "2.5",
            totalDose: "3",
            comments: "take with food",
          },
          dosageFrequencyId: {
            _id: "freq-1",
            name: "BID",
          },
          routeOfAdministrationId: {
            _id: "route-1",
            name: "PO",
          },
          doseAmount: "2.5",
          notes: "ignored because populated comments exist",
        },
        {
          medicineId: "med-2",
          measureUnitTypeId: {
            _id: "unit-2",
            name: "ml",
          },
          dosageFrequencyId: null,
          routeOfAdministrationId: null,
          doseAmount: 1,
          notes: "fallback note",
        },
      ] as never,
    );

    expect(response).toEqual({
      releaseDate: "2026-04-24T00:00:00.000Z",
      stitchesRemovalDate: "2026-04-27T00:00:00.000Z",
      nextInspectionDate: "2026-04-30T00:00:00.000Z",
      medicines: [
        {
          value: "med-1",
          text: "Carprofen",
          measureUnitTypeId: "unit-1",
          measureUnitText: "mg",
          dosageFrequencyId: "freq-1",
          frequencyText: "BID",
          doseAmount: 2.5,
          routeOfAdministrationId: "route-1",
          medicineRouteText: "PO",
          rangeMax: 2.5,
          rangeMin: 1,
          totalDose: 3,
          comments: "take with food",
        },
        {
          value: "med-2",
          text: "",
          measureUnitTypeId: "unit-2",
          measureUnitText: "ml",
          dosageFrequencyId: null,
          frequencyText: "",
          doseAmount: 1,
          routeOfAdministrationId: null,
          medicineRouteText: "",
          rangeMax: 0,
          rangeMin: 0,
          totalDose: 0,
          comments: "fallback note",
        },
      ],
    });
  });
});
