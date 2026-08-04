import {
  isClinicaVisitRow,
  mapAggregatesToClients,
} from "../../../src/services/clinica/clinicaClient.service.js";
import type { ImportedClinicaAggregate } from "../../../src/utils/clinica-query.types.js";

const aggregate = (
  petId: string,
  petName: string,
  recordText: string,
): ImportedClinicaAggregate => ({
  patient: {
    externalPatientId: petId,
    name: petName,
    owner: { name: " ישראל  ישראלי ", phone: " 0501234567 " },
  },
  medicalRecords: [{
    patientName: petName,
    ownerName: "ישראל ישראלי",
    ownerPhone: "0501234567",
    recordType: "visitDetails",
    rawText: recordText,
    table: { headers: ["תאריך", "טיפול"], rows: [["01/01/2026", recordText]] },
    syncedAt: new Date("2026-01-01T00:00:00.000Z"),
  }],
});

describe("Clinica client aggregate mapping", () => {
  it("accepts real visit rows and rejects Clinica's empty visit form", () => {
    expect(isClinicaVisitRow(["14:30 05/08/2026", "בדיקה"])).toBe(true);
    expect(isClinicaVisitRow(["05/08/202614:30", "בדיקה"])).toBe(true);
    expect(isClinicaVisitRow([
      "HH:MM dd/mm/yyyy",
      "בחר שם רופא Igor Milshtein צפייה ימים שבועות חודשים שנים",
    ])).toBe(false);
  });

  it("groups an owner's pets while retaining each pet id and records", () => {
    const clients = mapAggregatesToClients([
      aggregate("101", "לוקה", "בדיקה"),
      aggregate("102", "מיקה", "חיסון"),
    ]);

    expect(clients).toHaveLength(1);
    expect(clients[0]).toMatchObject({
      ownerName: "ישראל ישראלי",
      ownerPhone: "0501234567",
    });
    expect(clients[0].pets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        externalPatientId: "101",
        name: "לוקה",
        medicalRecords: [expect.objectContaining({ rawText: "בדיקה" })],
      }),
      expect.objectContaining({
        externalPatientId: "102",
        name: "מיקה",
        medicalRecords: [expect.objectContaining({ rawText: "חיסון" })],
      }),
    ]));
  });

  it("deduplicates the same pet id", () => {
    const clients = mapAggregatesToClients([
      aggregate("101", "לוקה", "בדיקה"),
      aggregate("101", "לוקה", "בדיקה"),
    ]);

    expect(clients[0].pets).toHaveLength(1);
  });

  it("keeps the master client id separate from the pet id", () => {
    const item = aggregate("625732", "Lexi", "checkup");
    item.patient.externalClientId = "17485";
    item.patient.owner.phone = "+972-50-123-4567";

    const [client] = mapAggregatesToClients([item]);

    expect(client.externalPatientId).toBe("17485");
    expect(client.ownerPhone).toBe("0501234567");
    expect(client.pets[0].externalPatientId).toBe("625732");
  });

  it("keeps an id-backed Clinica client even when no phone is available", () => {
    const item = aggregate("625732", "Lexi", "");
    item.patient.externalClientId = "17485";
    item.patient.owner.phone = "";

    const [client] = mapAggregatesToClients([item]);

    expect(client).toMatchObject({
      externalPatientId: "17485",
      ownerPhone: "",
      pets: [expect.objectContaining({ externalPatientId: "625732" })],
    });
  });

  it("rejects known Clinica label placeholders as pet demographics", () => {
    const item = aggregate("625732", "Lexi", "checkup");
    Object.assign(item.patient, {
      gender: "\u05d6\u05db\u05e8 \u05e0\u05e7\u05d1\u05d4",
      breed: "\u05de\u05d9\u05df: \u05d6\u05db\u05e8 \u05e0\u05e7\u05d1\u05d4",
      species: "\u05d4\u05d7\u05d9\u05d4:",
      weightKg: 0,
    });

    const [client] = mapAggregatesToClients([item]);

    expect(client.pets[0]).toMatchObject({
      name: "Lexi",
      externalPatientId: "625732",
    });
    expect(client.pets[0].gender).toBeUndefined();
    expect(client.pets[0].breed).toBeUndefined();
    expect(client.pets[0].species).toBeUndefined();
    expect(client.pets[0].weightKg).toBeUndefined();
  });

  it("groups formatting variants of the same owner without losing pets", () => {
    const first = aggregate("101", "Rex", "first visit");
    const second = aggregate("102", "Luna", "second visit");
    first.patient.externalClientId = "17485";
    second.patient.externalClientId = "99999";
    second.patient.owner.phone = "+972-50-123-4567";

    const clients = mapAggregatesToClients([first, second]);

    expect(clients).toHaveLength(1);
    expect(clients[0].externalPatientId).toBe("17485");
    expect(clients[0].pets.map((pet) => pet.externalPatientId)).toEqual([
      "101",
      "102",
    ]);
  });

  it("does not merge different pet ids that happen to share a name", () => {
    const clients = mapAggregatesToClients([
      aggregate("101", "Lucky", "first animal"),
      aggregate("102", "Lucky", "second animal"),
    ]);

    expect(clients[0].pets).toHaveLength(2);
    expect(clients[0].pets.map((pet) => pet.externalPatientId)).toEqual([
      "101",
      "102",
    ]);
  });

  it("unions cached visit rows for repeated snapshots of the same pet", () => {
    const older = aggregate("101", "Lucky", "older visit");
    const newer = aggregate("101", "Lucky", "newer visit");

    const [client] = mapAggregatesToClients([older, newer]);
    const visitRecord = client.pets[0].medicalRecords?.find(
      (record) => record.recordType === "visitDetails",
    );

    expect(visitRecord?.table?.rows).toEqual([
      ["01/01/2026", "newer visit"],
      ["01/01/2026", "older visit"],
    ]);
  });

  it("keeps a cached pet id when a directory snapshot omits it", () => {
    const withPetId = aggregate("101", "Lucky", "cached visit");
    const directoryOnly = aggregate("", "Lucky", "");
    withPetId.patient.externalClientId = "17485";
    directoryOnly.patient.externalClientId = "17485";
    directoryOnly.medicalRecords = [];

    const [client] = mapAggregatesToClients([withPetId, directoryOnly]);

    expect(client.pets).toHaveLength(1);
    expect(client.pets[0].externalPatientId).toBe("101");
    expect(client.pets[0].medicalRecords).toHaveLength(1);
  });

  it("imports a client with no phone when a master client id is available", () => {
    const item = aggregate("101", "Lucky", "");
    item.patient.externalClientId = "17485";
    item.patient.owner.phone = "";
    item.medicalRecords = [];

    const [client] = mapAggregatesToClients([item]);

    expect(client).toMatchObject({
      externalPatientId: "17485",
      ownerPhone: "",
      pets: [expect.objectContaining({ name: "Lucky" })],
    });
  });
});
