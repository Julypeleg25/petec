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

      results.push(patient);
    }

    return results;
  };
}

export const clinicaImportService = new ClinicaImportService();
