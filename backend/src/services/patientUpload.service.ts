import { patientService } from "@services/patient.service";
import { getUploadedStorageKey } from "@middlewares/upload";
import { sanitizeUploadedFileName } from "@utils/uploadFile.utils";
import { PATIENT_STORAGE } from "@constants/patient.constants";
import type {
  UploadDocumentDTO,
  PatientDocumentResponseDTO,
} from "@petec/shared";
import {
  requireUploadedFile,
  withUploadedFileRollback,
} from "@services/utils/patientUpload.service.utils";

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
    const storageKey = getUploadedStorageKey(uploadedFile);
    return withUploadedFileRollback(storageKey, async () =>
      patientService.uploadPatientPhoto(patientId, storageKey, userId),
    );
  }

  async uploadDocument({
    dto,
    userId,
    file,
  }: UploadDocumentParams): Promise<PatientDocumentResponseDTO> {
    const uploadedFile = requireUploadedFile(file);
    const storageKey = getUploadedStorageKey(uploadedFile);
    const fileName = sanitizeUploadedFileName(
      uploadedFile.originalname,
      PATIENT_STORAGE.DEFAULT_DOCUMENT_FILE_NAME,
    );

    return withUploadedFileRollback(storageKey, async () =>
      patientService.uploadDocumentMetadata(
        dto,
        storageKey,
        fileName,
        userId,
      ),
    );
  }
}

export const patientUploadService = new PatientUploadService();
