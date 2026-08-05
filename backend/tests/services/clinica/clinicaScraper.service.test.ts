import { ClinicaScraperService } from "../../../src/services/clinicaScraper.service.js";

describe("Clinica scraper parsing", () => {
  const scraper = new ClinicaScraperService();

  it("extracts a mobile phone without confusing other numbers", () => {
    expect(scraper.extractPhone(["12345", "טלפון 0501234567", "999"])).toBe(
      "0501234567",
    );
  });

  it("extracts a standalone Clinica identifier", () => {
    expect(scraper.extractClientNumber(["לקוח", "123456", "0501234567"])).toBe(
      "123456",
    );
  });

  it("deduplicates patients by pet name and owner phone", () => {
    const item = {
      patient: {
        externalPatientId: "101",
        name: "לוקה",
        owner: { name: "ישראל", phone: "0501234567" },
      },
      medicalRecords: [],
    };

    expect(scraper.removeDuplicates([item, { ...item }])).toHaveLength(1);
  });

  it("does not turn an owner name into a pet when the owner has no pets", () => {
    expect(scraper.extractOwnerAndPetNames("Owner Name")).toEqual({
      ownerName: "Owner Name",
      petNames: [],
    });
  });

  it("keeps pet names that are explicitly separated from the owner", () => {
    expect(scraper.extractOwnerAndPetNames("Owner Name + Rex + Luna")).toEqual({
      ownerName: "Owner Name",
      petNames: ["Rex", "Luna"],
    });
  });

  it("rejects an address returned as a pet name", () => {
    expect(scraper.isValidPetName("סיטי 13 אשקלון (האוס- מרכז)")).toBe(false);
    expect(scraper.isValidPetName("כפר מרדכי (האוס- מרכז)")).toBe(false);
    expect(scraper.isValidPetName("רוקי")).toBe(true);
  });

  it("creates a client-only aggregate when an owner has no animals", () => {
    const item = scraper.mapDirectoryClientAggregate({
      recordID: "18001",
      FirstName: "Owner",
      LastName: "Only",
      CellPhone: "0501234567",
    });

    expect(item).toMatchObject({
      patient: {
        externalClientId: "18001",
        name: "",
        owner: { name: "Owner Only", phone: "0501234567" },
      },
      medicalRecords: [],
    });
  });
});
