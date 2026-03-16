import { patientService } from "@services/patient";
import { sanitizeUploadedFileName } from "@utils/uploadFile.utils";
import { PATIENT_STORAGE } from "@constants/patient.constants";
import type {
  UploadDocumentDTO,
  PatientDocumentResponseDTO,
} from "@petec/shared";
import {
  requireUploadedFile,
} from "@services/patient/utils/patientUploadService.utils";

type UploadPatientPhotoParams = {
  patientId: string;
  userId: string;
  file?: Express.Multer.File;
};

type UploadDocumentParams = {
  dto: UploadDocumentDTO;
  userId: string;
  file?: Express.Multer.File;
};

export class PatientUploadService {
  async uploadPatientPhoto({
    patientId,
    userId,
    file,
  }: UploadPatientPhotoParams): Promise<string> {
    const uploadedFile = requireUploadedFile(file);
    return patientService.uploadPatientPhoto(
      patientId,
      uploadedFile.buffer,
      uploadedFile.originalname,
      userId,
    );
  }

  async uploadDocument({
    dto,
    userId,
    file,
  }: UploadDocumentParams): Promise<PatientDocumentResponseDTO> {
    const uploadedFile = requireUploadedFile(file);
    const fileName = sanitizeUploadedFileName(
      uploadedFile.originalname,
      PATIENT_STORAGE.DEFAULT_DOCUMENT_FILE_NAME,
    );

    return patientService.uploadDocument(
      dto,
      uploadedFile.buffer,
      fileName,
      userId,
    );
  }
}

export const patientUploadService = new PatientUploadService();
