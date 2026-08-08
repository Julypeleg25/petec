import { ENV } from "../src/config/config.js";
import { ClinicaScraperService } from "../src/services/clinicaScraper.service.js";

type DirectoryClient = {
  recordID?: string | number;
  UserID?: string;
  FirstName?: string;
  LastName?: string;
};

type DirectoryPet = {
  PetID?: string | number;
  Name?: string;
  Type?: string;
  Breed?: string;
};

const clientNumbers = process.argv.slice(2);
const scraper = new ClinicaScraperService();

await scraper.init();
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
    const clientsWithPets = await Promise.all(
      matches.map(async (client) => ({
        client,
        pets: client.UserID
          ? await scraper.requestClinicaArray<DirectoryPet>(
              page,
              "GetPetsNames",
              { PatientID: client.UserID },
            )
          : [],
      })),
    );
    console.log(JSON.stringify({ clientNumber, matches: clientsWithPets }, null, 2));
  }
} finally {
  await context.close().catch(() => undefined);
  await scraper.close();
}
