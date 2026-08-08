import mongoose from "mongoose";
import { ENV } from "../src/config/config.js";
import { ClinicaClientModel } from "../src/models/clinicaClient/index.js";
import { ClinicaMedicalRecordModel } from "../src/models/clinicaMedicalRecord/ClinicaMedicalRecord.js";

await mongoose.connect(ENV.mongoDBUri);

try {
  const [clients, records] = await Promise.all([
    ClinicaClientModel.updateMany(
      {},
      {
        $unset: {
          "pets.$[].medicalRecords": "",
          "rawData.original.medicalRecords": "",
          "rawData.original.patient.medicalRecords": "",
        },
      },
    ),
    ClinicaMedicalRecordModel.deleteMany({}),
  ]);

  console.log(JSON.stringify({
    updatedClinicaClients: clients.modifiedCount,
    deletedMedicalRecords: records.deletedCount,
  }));
} finally {
  await mongoose.disconnect();
}
