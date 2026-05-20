import { buildCalendarMonthResponse } from "../../../../src/services/patient/utils/patientCalendar.utils.js";

describe("patientCalendar.utils", () => {
  it("builds calendar month days with sorted badges and patient ordering", () => {
    const updatedAt = new Date("2026-04-09T08:00:00.000Z");

    const response = buildCalendarMonthResponse(
      [
        {
          _id: "case-1",
          serialId: "100-1",
          masterCaseId: "master-1",
          admission: {
            hospitalizationReason: "  Fever observation  ",
          },
          flags: {
            isProcedure: true,
            isAggressive: true,
          },
          dates: {
            procedureDate: "2026-04-10",
          },
          caseDetailsGrid: [
            {
              date: "2026-04-10",
            },
          ],
          patientId: {
            _id: "patient-1",
            name: "Bela",
            owner: {
              name: "Owner B",
              phone: "0501234567",
            },
            photoName: "photo.jpg",
            updatedAt,
          },
        },
        {
          _id: "case-2",
          serialId: "099-1",
          admission: {
            hospitalizationReason: " ",
          },
          flags: {
            isProcedure: false,
            isAllergic: true,
          },
          caseDetailsGrid: [
            {
              dateTime: "2026-04-10T12:00:00.000Z",
            },
          ],
          patientId: {
            _id: "patient-2",
            name: "Alfa",
            owner: {
              name: "Owner A",
              phone: "0507654321",
            },
            photoName: "/assets/default.png",
          },
        },
        {
          _id: "case-3",
          serialId: "101-1",
          flags: {
            isProcedure: true,
          },
          dates: {
            procedureDate: "2026-04-12",
          },
          caseDetailsGrid: [
            {
              date: "2026-05-01",
            },
          ],
          patientId: {
            _id: "patient-3",
            name: "Charlie",
            owner: {
              name: "Owner C",
              phone: "0500000000",
            },
            photoName: "https://cdn.example.com/p.jpg",
          },
        },
        {
          _id: "case-4",
          serialId: "102-1",
          flags: {
            isProcedure: true,
          },
          dates: {
            procedureDate: "2026-04-10",
          },
          patientId: "patient-4",
        },
      ] as never,
      2026,
      4,
    );

    expect(response).toEqual({
      year: 2026,
      month: 4,
      days: [
        {
          date: "2026-04-10",
          patients: [
            {
              caseId: "case-1",
              masterCaseId: "master-1",
              patientId: "patient-1",
              serialId: "100-1",
              patientName: "Bela",
              ownerName: "Owner B",
              ownerPhoneNumber: "0501234567",
              hospitalizationReason: "Fever observation",
              photoName: `/api/v1/patient/photo/patient-1?v=${updatedAt.getTime()}`,
              badges: ["procedure", "hospitalization"],
              flags: {
                isAggressive: true,
                isEscapePotential: false,
                isAllergic: false,
                isRiskAnesthesia: false,
                isHeartMurmur: false,
                isAMB: false,
              },
            },
            {
              caseId: "case-2",
              masterCaseId: undefined,
              patientId: "patient-2",
              serialId: "099-1",
              patientName: "Alfa",
              ownerName: "Owner A",
              ownerPhoneNumber: "0507654321",
              hospitalizationReason: undefined,
              photoName: "/assets/default.png",
              badges: ["hospitalization"],
              flags: {
                isAggressive: false,
                isEscapePotential: false,
                isAllergic: true,
                isRiskAnesthesia: false,
                isHeartMurmur: false,
                isAMB: false,
              },
            },
          ],
        },
        {
          date: "2026-04-12",
          patients: [
            {
              caseId: "case-3",
              masterCaseId: undefined,
              patientId: "patient-3",
              serialId: "101-1",
              patientName: "Charlie",
              ownerName: "Owner C",
              ownerPhoneNumber: "0500000000",
              hospitalizationReason: undefined,
              photoName: "https://cdn.example.com/p.jpg",
              badges: ["procedure"],
              flags: {
                isAggressive: false,
                isEscapePotential: false,
                isAllergic: false,
                isRiskAnesthesia: false,
                isHeartMurmur: false,
                isAMB: false,
              },
            },
          ],
        },
      ],
    });
  });

  it("returns an empty month when no cases land in the requested month", () => {
    expect(
      buildCalendarMonthResponse(
        [
          {
            _id: "case-1",
            serialId: "100-1",
            flags: {
              isProcedure: true,
            },
            dates: {
              procedureDate: "2026-05-01",
            },
            patientId: {
              _id: "patient-1",
            },
          },
        ] as never,
        2026,
        4,
      ),
    ).toEqual({
      year: 2026,
      month: 4,
      days: [],
    });
  });

  it("sorts same-priority calendar patients by name and then serial id", () => {
    const response = buildCalendarMonthResponse(
      [
        {
          _id: "case-1",
          serialId: "101-1",
          caseDetailsGrid: [{ date: "2026-04-15" }],
          patientId: {
            _id: "patient-1",
            name: "Alpha",
          },
        },
        {
          _id: "case-2",
          serialId: "099-1",
          caseDetailsGrid: [{ date: "2026-04-15" }],
          patientId: {
            _id: "patient-2",
            name: "Alpha",
          },
        },
        {
          _id: "case-3",
          serialId: "050-1",
          caseDetailsGrid: [{ date: "2026-04-15" }],
          patientId: {
            _id: "patient-3",
            name: "Beta",
          },
        },
      ] as never,
      2026,
      4,
    );

    expect(response.days).toEqual([
      {
        date: "2026-04-15",
        patients: [
          expect.objectContaining({
            caseId: "case-2",
            patientName: "Alpha",
            serialId: "099-1",
            badges: ["hospitalization"],
          }),
          expect.objectContaining({
            caseId: "case-1",
            patientName: "Alpha",
            serialId: "101-1",
            badges: ["hospitalization"],
          }),
          expect.objectContaining({
            caseId: "case-3",
            patientName: "Beta",
            serialId: "050-1",
            badges: ["hospitalization"],
          }),
        ],
      },
    ]);
  });
});
