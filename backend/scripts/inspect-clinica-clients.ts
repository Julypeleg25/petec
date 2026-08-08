import mongoose from "mongoose";
import { ENV } from "../src/config/config.js";
import { ClinicaClientModel } from "../src/models/clinicaClient/index.js";

const clientNumbers = process.argv.slice(2);

await mongoose.connect(ENV.mongoDBUri);
try {
  const clients = await ClinicaClientModel.find({
    $or: [
      { externalPatientId: { $in: clientNumbers } },
      { "pets.externalPatientId": { $in: clientNumbers } },
    ],
  }).select({
    externalPatientId: 1,
    ownerName: 1,
    "pets.externalPatientId": 1,
    "pets.name": 1,
  }).lean();

  for (const clientNumber of clientNumbers) {
    const matches = clients.filter(
      (client) =>
        client.externalPatientId === clientNumber ||
        client.pets?.some((pet) => pet.externalPatientId === clientNumber),
    );
    console.log(JSON.stringify({ clientNumber, matches }, null, 2));
  }
} finally {
  await mongoose.disconnect();
}
