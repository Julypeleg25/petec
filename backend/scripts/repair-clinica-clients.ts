import mongoose from "mongoose";
import { ENV } from "../src/config/config.js";
import { ClinicaClientModel } from "../src/models/clinicaClient/index.js";
import { mapAggregatesToClients } from "../src/services/clinica/clinicaClient.service.js";
import { ClinicaScraperService } from "../src/services/clinicaScraper.service.js";

type DirectoryClient = {
  recordID?: string | number;
  UserID?: string;
  FirstName?: string;
  LastName?: string;
  Phone?: string;
  Phone2?: string;
  CellPhone?: string;
  CellPhone2?: string;
  CellPhone3?: string;
};

type DirectoryPet = Parameters<ClinicaScraperService["mapDirectoryPetAggregate"]>[1];

const clientNumbers = process.argv.slice(2);
if (clientNumbers.length === 0) throw new Error("Provide at least one client number");

const scraper = new ClinicaScraperService();
await Promise.all([scraper.init(), mongoose.connect(ENV.mongoDBUri)]);
const context = await scraper.getBrowser().newContext();
const page = await context.newPage();

try {
  await scraper.login(page, {
    username: ENV.clinicUsername,
    password: ENV.clinicPassword,
  });
  await scraper.selectClinicCenterIfNeeded(page);
  await scraper.openClientsPage(page);

  for (const clientNumber of clientNumbers) {
    const matches = await scraper.requestClinicaArray<DirectoryClient>(
      page,
      "SearchByCustNumber",
      { rpd: 0, CustNumber: clientNumber },
    );
    const directoryClient = matches.find(
      (candidate) => String(candidate.recordID ?? "") === clientNumber,
    );
    if (!directoryClient) throw new Error(`Clinica client ${clientNumber} was not found`);

    const directoryPets = directoryClient.UserID
      ? await scraper.requestClinicaArray<DirectoryPet>(
          page,
          "GetPetsNames",
          { PatientID: directoryClient.UserID },
        )
      : [];
    const aggregates = directoryPets
      .map((pet) => scraper.mapDirectoryPetAggregate(directoryClient, pet))
      .filter((item) => item !== null);
    if (aggregates.length === 0) {
      const ownerOnly = scraper.mapDirectoryClientAggregate(directoryClient);
      if (ownerOnly) aggregates.push(ownerOnly);
    }
    const [authoritative] = mapAggregatesToClients(aggregates);
    if (!authoritative) throw new Error(`Clinica client ${clientNumber} could not be mapped`);

    const storedClient = await ClinicaClientModel.findOne({
      externalPatientId: clientNumber,
    }).lean();
    if (!storedClient) throw new Error(`Stored client ${clientNumber} was not found`);

    const normalizePetName = (value: string): string =>
      value.trim().replace(/\s+/g, " ").toLocaleLowerCase("he-IL");
    const repairedPets = authoritative.pets.map((pet) => {
      const storedPet = storedClient.pets.find(
        (candidate) =>
          (pet.externalPatientId &&
            candidate.externalPatientId === pet.externalPatientId) ||
          normalizePetName(candidate.name) === normalizePetName(pet.name),
      );
      return {
        ...pet,
      };
    });

    const conflictingOwner = await ClinicaClientModel.findOne({
      externalPatientId: { $ne: clientNumber },
      ownerName: authoritative.ownerName,
      ownerPhone: authoritative.ownerPhone,
    }).select({ externalPatientId: 1 }).lean();
    if (conflictingOwner) {
      throw new Error(
        `Client ${clientNumber} conflicts with stored client ${conflictingOwner.externalPatientId ?? conflictingOwner._id}`,
      );
    }

    const result = await ClinicaClientModel.updateOne(
      { externalPatientId: clientNumber },
      {
        $set: {
          ownerName: authoritative.ownerName,
          ownerPhone: authoritative.ownerPhone,
          pets: repairedPets,
        },
      },
    );
    if (result.matchedCount !== 1) {
      throw new Error(`Stored client ${clientNumber} was not found`);
    }
    console.log(
      `${clientNumber}: ${authoritative.ownerName} (${repairedPets.map((pet) => pet.name).join(", ") || "no pets"})`,
    );
  }
} finally {
  await context.close().catch(() => undefined);
  await scraper.close();
  await mongoose.disconnect();
}
