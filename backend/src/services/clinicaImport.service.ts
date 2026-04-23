import { PatientModel } from "@models/Patient";
import { ImportedClinicaAggregate } from "@types/clinica-query.types";

export class ClinicaImportService {
  async importAggregate(data: ImportedClinicaAggregate): Promise<ImportedClinicaAggregate> {
    const updatePayload: {
      name: string;
      owner: {
        name: string;
        phone: string;
      };
      photoName?: string;
    } = {
      name: data.patient.name,
      owner: {
        name: data.patient.owner.name,
        phone: data.patient.owner.phone,
      },
    };

    if (data.patient.photoName) {
      updatePayload.photoName = data.patient.photoName;
    }

    await PatientModel.findOneAndUpdate(
      {
        $or: [
          {
            name: data.patient.name,
            "owner.phone": data.patient.owner.phone,
          },
        ],
      },
      {
        $set: updatePayload,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return data;
  }
}

export const clinicaImportService = new ClinicaImportService();