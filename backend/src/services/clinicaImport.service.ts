import { ClinicaMedicalRecordModel } from "../models/clinicaMedicalRecord/ClinicaMedicalRecord.js";
import { PatientModel } from "../models/patient/Patient.js";
import { ImportedClinicaAggregate } from "../utils/clinica-query.types.js";

class ClinicaImportService {
  importMany = async (items: ImportedClinicaAggregate[]): Promise<unknown[]> => {
    const results: unknown[] = [];

    for (const item of items) {
      if (!item.patient.name) {
        continue;
      }

      const patient = await PatientModel.findOneAndUpdate(
        {
          name: item.patient.name,
          "owner.phone": item.patient.owner.phone,
        },
        {
          $set: {
            name: item.patient.name,
            owner: {
              name: item.patient.owner.name,
              phone: item.patient.owner.phone,
            },
          },
        },
        {
          returnDocument: "after",
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

      for (const record of item.medicalRecords) {
        if (!record.rawText) {
          continue;
        }

        await ClinicaMedicalRecordModel.findOneAndUpdate(
          {
            patientId: patient._id,
            recordType: record.recordType,
          },
          {
            $set: {
              patientId: patient._id,
              patientName: record.patientName,
              ownerName: record.ownerName,
              ownerPhone: record.ownerPhone,
              recordType: record.recordType,
              rawText: record.rawText,
              syncedAt: record.syncedAt,
            },
          },
          {
            returnDocument: "after",
            upsert: true,
            setDefaultsOnInsert: true,
          },
        );
      }

      results.push(patient);
    }

    return results;
  };
}

export const clinicaImportService = new ClinicaImportService();
