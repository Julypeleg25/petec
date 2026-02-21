import {
  requestBlob,
  requestFormDataWithResponseSchema,
  requestNoContent,
  requestWithRequestAndResponseSchema,
  requestWithRequestSchemaNoContent,
  requestWithSchema,
} from "../../lib/api-client";
import { API_ROUTES } from "../../config/api-routes";
import {
  NewPatientDTO,
  NewPatientDTOSchema,
  EditPatientDTO,
  EditPatientDTOSchema,
  ReleasePatientDTO,
  ReleasePatientDTOSchema,
  ArchivePatientDTO,
  ArchivePatientDTOSchema,
  DeletePatientCaseDTO,
  DeletePatientCaseDTOSchema,
  UploadDocumentDTO,
  UploadDocumentDTOSchema,
  CreateAnesthesiaProcedureFormDTO,
  CreateAnesthesiaProcedureFormDTOSchema,
  CreatePatientResponseDTO,
  CreatePatientResponseDTOSchema,
  PatientDocumentResponseDTO,
  PatientDocumentResponseDTOSchema,
  PatientDocumentListResponseDTOSchema,
  ChartsDataResponseDTO,
  ChartsDataResponseDTOSchema,
  UpdateDailyPlanRequestDTO,
  UpdateDailyPlanRequestDTOSchema,
  DailyPlanDetailDTO,
  DailyPlanDetailListResponseDTOSchema,
  CaseDetailsResponseDTO,
  CaseDetailsResponseDTOSchema,
  ReleasePatientDataResponseDTO,
  ReleasePatientDataResponseDTOSchema,
  CaseIdParamsDTOSchema,
  PatientIdParamsDTOSchema,
  DocumentIdParamsDTOSchema,
} from "@petec/shared";

export const patientsApi = {
  createPatient: (dto: NewPatientDTO): Promise<CreatePatientResponseDTO> =>
    requestWithRequestAndResponseSchema(
      { method: "post", url: API_ROUTES.patient.create },
      dto,
      NewPatientDTOSchema,
      CreatePatientResponseDTOSchema,
    ),

  updatePatient: (dto: EditPatientDTO): Promise<void> =>
    requestWithRequestSchemaNoContent(
      { method: "put", url: API_ROUTES.patient.edit },
      dto,
      EditPatientDTOSchema,
    ),

  getCaseDetails: (caseId: string): Promise<CaseDetailsResponseDTO> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithSchema(
      { method: "get", url: API_ROUTES.patient.caseDetails(params.caseId) },
      CaseDetailsResponseDTOSchema,
    );
  },

  releasePatient: (dto: ReleasePatientDTO): Promise<void> =>
    requestWithRequestSchemaNoContent(
      { method: "post", url: API_ROUTES.patient.release },
      dto,
      ReleasePatientDTOSchema,
    ),

  getReleasePatientData: (caseId: string): Promise<ReleasePatientDataResponseDTO> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithSchema(
      { method: "get", url: API_ROUTES.patient.releaseData(params.caseId) },
      ReleasePatientDataResponseDTOSchema,
    );
  },

  archivePatient: (dto: ArchivePatientDTO): Promise<void> =>
    requestWithRequestSchemaNoContent(
      { method: "put", url: API_ROUTES.patient.archiveCase },
      dto,
      ArchivePatientDTOSchema,
    ),

  deleteCase: (dto: DeletePatientCaseDTO): Promise<void> =>
    requestWithRequestSchemaNoContent(
      { method: "delete", url: API_ROUTES.patient.deleteCase },
      dto,
      DeletePatientCaseDTOSchema,
    ),

  getDocuments: (patientId: string): Promise<PatientDocumentResponseDTO[]> => {
    const params = PatientIdParamsDTOSchema.parse({ patientId });
    return requestWithSchema(
      { method: "get", url: API_ROUTES.patient.documents(params.patientId) },
      PatientDocumentListResponseDTOSchema,
    );
  },

  uploadDocument: (
    dto: UploadDocumentDTO,
    file: File,
  ): Promise<PatientDocumentResponseDTO> => {
    UploadDocumentDTOSchema.parse(dto);
    const form = new FormData();
    form.append("file", file);
    Object.entries(dto).forEach(([k, v]) => {
      if (v !== undefined) form.append(k, String(v));
    });
    return requestFormDataWithResponseSchema(
      { method: "post", url: API_ROUTES.patient.documentsUpload },
      form,
      PatientDocumentResponseDTOSchema,
    );
  },

  deleteDocument: (id: string): Promise<void> => {
    const params = DocumentIdParamsDTOSchema.parse({ documentId: id });
    return requestNoContent({
      method: "delete",
      url: API_ROUTES.patient.documentsDelete(params.documentId),
    });
  },

  getAnesthesiaForm: (caseId: string): Promise<CreateAnesthesiaProcedureFormDTO | null> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithSchema(
      { method: "get", url: API_ROUTES.patient.anesthesia(params.caseId) },
      CreateAnesthesiaProcedureFormDTOSchema.nullable(),
    );
  },

  upsertAnesthesiaForm: (
    caseId: string,
    dto: CreateAnesthesiaProcedureFormDTO,
  ): Promise<CreateAnesthesiaProcedureFormDTO> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithRequestAndResponseSchema(
      { method: "post", url: API_ROUTES.patient.anesthesia(params.caseId) },
      dto,
      CreateAnesthesiaProcedureFormDTOSchema,
      CreateAnesthesiaProcedureFormDTOSchema,
    );
  },

  getChartsData: (caseId: string): Promise<ChartsDataResponseDTO> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithSchema(
      { method: "get", url: API_ROUTES.patient.chartsData(params.caseId) },
      ChartsDataResponseDTOSchema,
    );
  },

  exportCase: (caseId: string): Promise<Blob> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestBlob({ method: "get", url: API_ROUTES.patient.exportCase(params.caseId) });
  },

  getDailyPlan: (): Promise<DailyPlanDetailDTO[]> =>
    requestWithSchema({ method: "get", url: API_ROUTES.patient.dailyPlan.get }, DailyPlanDetailListResponseDTOSchema),

  updateDailyPlan: (data: UpdateDailyPlanRequestDTO): Promise<void> =>
    requestNoContent({
      method: "put",
      url: API_ROUTES.patient.dailyPlan.update,
      data: UpdateDailyPlanRequestDTOSchema.parse(data),
    }),
};
