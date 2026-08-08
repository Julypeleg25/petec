import {
  LAST_PATIENTS_ENDPOINT_PATH,
  LAST_PATIENTS_PAYLOAD,
  formatClinicaDateTime,
  selectLatestClinicaClients,
  syncLatestClinicaClientRows,
  toClinicaVisitRow,
  toClinicaPet,
  type RegPersonal,
} from "../../../src/services/clinicaApiClients.service.js";
import {
  mergePet,
  mergePets,
  toPlainClinicaPets,
} from "../../../src/utils/clinicaPetMerge.utils.js";

const client = (
  recordID: number,
  UserID: string,
  LastVisit: string,
): RegPersonal => ({
  recordID,
  UserID,
  FirstName: `first-${recordID}`,
  LastName: `last-${recordID}`,
  CellPhone: "",
  Phone: "",
  Address: "",
  Email: "",
  LastVisit,
});

describe("Clinica latest client selection", () => {
  it("uses the GetLastPatients endpoint and payload", () => {
    expect(LAST_PATIENTS_ENDPOINT_PATH).toBe(
      "/Restricted/dbCalander.asmx/GetLastPatients",
    );
    expect(LAST_PATIENTS_PAYLOAD).toEqual({ move: 0, fromDate: "" });
  });

  it("preserves endpoint order and selects exactly the first 20 valid unique clients", () => {
    const rows = [
      client(1, "user-1", "01/01/2000"),
      client(2, "user-1", "12/31/2099"),
      client(0, "user-invalid", "12/31/2099"),
      ...Array.from({ length: 24 }, (_, index) =>
        client(index + 3, `user-${index + 3}`, "01/01/2000"),
      ),
    ];

    const selected = selectLatestClinicaClients(rows);

    expect(selected).toHaveLength(20);
    expect(selected.map((row) => row.recordID)).toEqual([
      1,
      ...Array.from({ length: 19 }, (_, index) => index + 3),
    ]);
  });

  it("continues syncing after a client fails", async () => {
    const rows = [
      client(1, "user-1", ""),
      client(2, "user-2", ""),
      client(3, "user-3", ""),
    ];
    const processed: number[] = [];

    const result = await syncLatestClinicaClientRows(rows, async (row) => {
      processed.push(row.recordID);
      if (row.recordID === 2) throw new Error("failed");
      return "updated";
    });

    expect(processed).toEqual([1, 2, 3]);
    expect(result).toMatchObject({ rowsSeen: 3, updated: 2, skipped: 1 });
  });
});

describe("Clinica date formatting", () => {
  it("formats Clinica dates in Israeli 24-hour format", () => {
    expect(formatClinicaDateTime("7/28/2026 2:18:00 PM")).toBe(
      "28/7/2026 14:18:00",
    );
    expect(formatClinicaDateTime("7/28/2026 12:05:09 AM")).toBe(
      "28/7/2026 00:05:09",
    );
  });
});

describe("Clinica visit response mapping", () => {
  it("maps labeled session fields into separate detail lines", () => {
    const row = toClinicaVisitRow({
      BranchName: "Center",
      Date: "7/28/2026 14:18",
      Session: {
        SessionID: 10,
        Date: "7/28/2026 2:18:00 PM",
        TherapistName: "Doctor",
        Reason: "Reason text",
        Finds: ": : Findings sentence. Next sentence.",
        Items: [{ FieldName: "Treatment" }],
      },
    });

    expect(row?.[0]).toBe("28/7/2026 14:18:00");
    expect(row?.[1]).toContain("הרופא: Doctor\n");
    expect(row?.[1]).toContain("היסטוריה וסיבת הביקור: Reason text\n");
    expect(row?.[1]).toContain(
      "ממצאים ובדיקות: Findings sentence. Next sentence.\n",
    );
    expect(row?.[1]).toContain("פריטים: Treatment");
  });

  it("keeps document-only rows and their links", () => {
    const url = "https://www.vetconnectplus.com/diagnostics/1/1-2";
    const row = toClinicaVisitRow({
      Date: "12/15/2024 00:00",
      Docs: { FilePath: url, DocNotes: "Blood count" },
    });

    expect(row?.[1]).toBe(`מסמך: Blood count\n${url}`);
  });
});

describe("Clinica pet mapping", () => {
  it("maps color from the pet detail response", () => {
    const rawPet = {
      PetID: 9,
      Name: "Luna",
      Color: "  Brown  ",
      ElectNumber: "9901",
      Neut: 1,
      InsuranceName: "Marpet",
      JumpNote: "Sensitive",
    };

    expect(toClinicaPet(rawPet)).toMatchObject({
      externalPatientId: "9",
      name: "Luna",
      color: "Brown",
      microchipNumber: "9901",
      neutered: true,
      insurance: "Marpet",
      notes: "Sensitive",
      rawData: rawPet,
    });
  });

  it("updates color when supplied and preserves it when omitted", () => {
    const existing = { name: "Luna", color: "Brown" };

    expect(mergePet(existing, { name: "Luna", color: "Black" }).color).toBe(
      "Black",
    );
    expect(mergePet(existing, { name: "Luna" }).color).toBe("Brown");
  });

  it("converts stored subdocuments before merging enriched pet details", () => {
    const storedPet = {
      name: "Luna",
      toObject: () => ({ name: "Luna", weightKg: 12 }),
    };
    const incomingPet = {
      externalPatientId: "9",
      name: "Luna",
      color: "Black",
    };

    expect(mergePets(toPlainClinicaPets([storedPet]), [incomingPet])).toEqual([
      {
        externalPatientId: "9",
        name: "Luna",
        color: "Black",
        weightKg: 12,
        gender: undefined,
        breed: undefined,
        species: undefined,
        ageYears: undefined,
        ageMonths: undefined,
        insurance: undefined,
        microchipNumber: undefined,
        neutered: undefined,
        notes: undefined,
        rawData: undefined,
        treatingDoctor: undefined,
        referringDoctor: undefined,
      },
    ]);
  });
});
