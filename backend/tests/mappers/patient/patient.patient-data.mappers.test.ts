import {
  mapEditDtoToPatientUpdate,
  mapNewPatientDtoToPatientData,
} from "../../../src/mappers/patient/patient.patient-data.mappers.js";

describe("patient.patient-data.mappers", () => {
  it("maps new patient DTOs to patient create data", () => {
    expect(
      mapNewPatientDtoToPatientData({
        caseId: "CASE-123",
        name: "Milo",
        owner: {
          name: "Dana",
          phone: "0501234567",
        },
      } as never),
    ).toEqual({
      serialId: "CASE-123",
      name: "Milo",
      owner: {
        name: "Dana",
        phone: "0501234567",
      },
    });
  });

  it("maps only defined editable patient fields", () => {
    expect(
      mapEditDtoToPatientUpdate({
        name: "Luna",
        owner: {
          name: "Eli",
        },
      } as never),
    ).toEqual({
      name: "Luna",
      owner: {
        name: "Eli",
      },
    });

    expect(
      mapEditDtoToPatientUpdate({
        name: "",
        owner: undefined,
      } as never),
    ).toEqual({});
  });
});
