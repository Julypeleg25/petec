import { PatientModel } from "../models/patient/Patient.js";
import { ImportedClinicaAggregate } from "../utils/clinica-query.types.js";

class ClinicaImportService {
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
        name: data.patient.name,
        "owner.phone": data.patient.owner.phone,
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

  async importMany(items: ImportedClinicaAggregate[]): Promise<ImportedClinicaAggregate[]> {
    const imported: ImportedClinicaAggregate[] = [];

    for (const item of items) {
      const result = await this.importAggregate(item);
      imported.push(result);
    }

    return imported;
  }
}

export const clinicaImportService = new ClinicaImportService();