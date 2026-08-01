import {
  requestFormDataWithResponseSchema,
  requestNoContent,
  requestWithRequestAndResponseSchema,
  requestWithRequestSchemaNoContent,
  requestWithSchema,
} from "../../lib/apiClient";
import { API_ROUTES } from "../../config/apiRoutes";
import { HTTP_METHODS } from "../../lib/http.constants";
import { PATIENTS_UPLOAD_FILE_FIELD_NAME } from "./constants/patients.constants";
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
  UploadPatientPhotoResponseDTO,
  UploadPatientPhotoResponseDTOSchema,
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
  CalendarMonthParamsDTOSchema,
  CalendarMonthResponseDTO,
  CalendarMonthResponseDTOSchema,
  CaseDetailsResponseDTO,
  CaseDetailsResponseDTOSchema,
  ReleasePatientDataResponseDTO,
  ReleasePatientDataResponseDTOSchema,
  CaseIdParamsDTOSchema,
  PatientIdParamsDTOSchema,
  DocumentIdParamsDTOSchema,
  ClinicalSummaryResultDTO,
  ClinicalSummaryResultDTOSchema,
  ClinicalSummaryRequestDTOSchema,
} from "@petec/shared";

export const patientsApi = {
  generateClinicalSummary: (
    patientId: string,
    date?: string,
  ): Promise<ClinicalSummaryResultDTO> => {
    const params = PatientIdParamsDTOSchema.parse({ patientId });
    const body = ClinicalSummaryRequestDTOSchema.parse({ date });
    return requestWithSchema(
      {
        method: HTTP_METHODS.POST,
        url: API_ROUTES.patient.clinicalSummary(params.patientId),
        data: body,
      },
      ClinicalSummaryResultDTOSchema,
    );
  },

  createPatient: (dto: NewPatientDTO): Promise<CreatePatientResponseDTO> =>
    requestWithRequestAndResponseSchema(
      { method: HTTP_METHODS.POST, url: API_ROUTES.patient.create },
      dto,
      NewPatientDTOSchema,
      CreatePatientResponseDTOSchema,
    ),

  updatePatient: (dto: EditPatientDTO): Promise<void> =>
    requestWithRequestSchemaNoContent(
      { method: HTTP_METHODS.PUT, url: API_ROUTES.patient.edit },
      dto,
      EditPatientDTOSchema,
    ),

  getCaseDetails: (
    caseId: string,
    masterCaseId?: string,
  ): Promise<CaseDetailsResponseDTO> => {
    const params = CaseIdParamsDTOSchema.parse({
      caseId,
      masterCaseId: masterCaseId || undefined,
    });
    const url = params.masterCaseId
      ? API_ROUTES.patient.caseDetailsWithMaster(
        params.masterCaseId,
        params.caseId,
      )
      : API_ROUTES.patient.caseDetails(params.caseId);

    return requestWithSchema(
      {
        method: HTTP_METHODS.GET,
        url,
      },
      CaseDetailsResponseDTOSchema,
    );
  },

  releasePatient: (dto: ReleasePatientDTO): Promise<void> =>
    requestWithRequestSchemaNoContent(
      { method: HTTP_METHODS.POST, url: API_ROUTES.patient.release },
      dto,
      ReleasePatientDTOSchema,
    ),

  getReleasePatientData: (caseId: string): Promise<ReleasePatientDataResponseDTO> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithSchema(
      { method: HTTP_METHODS.GET, url: API_ROUTES.patient.releaseData(params.caseId) },
      ReleasePatientDataResponseDTOSchema,
    );
  },

  archivePatient: (dto: ArchivePatientDTO): Promise<void> =>
    requestWithRequestSchemaNoContent(
      { method: HTTP_METHODS.PUT, url: API_ROUTES.patient.archiveCase },
      dto,
      ArchivePatientDTOSchema,
    ),

  deleteCase: (dto: DeletePatientCaseDTO): Promise<void> =>
    requestWithRequestSchemaNoContent(
      { method: HTTP_METHODS.DELETE, url: API_ROUTES.patient.deleteCase },
      dto,
      DeletePatientCaseDTOSchema,
    ),

  getDocuments: (caseId: string): Promise<PatientDocumentResponseDTO[]> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithSchema(
      { method: HTTP_METHODS.GET, url: API_ROUTES.patient.documentsByCase(params.caseId) },
      PatientDocumentListResponseDTOSchema,
    );
  },

  uploadDocument: (
    dto: UploadDocumentDTO,
    file: File,
  ): Promise<PatientDocumentResponseDTO> => {
    UploadDocumentDTOSchema.parse(dto);
    const form = new FormData();
    form.append(PATIENTS_UPLOAD_FILE_FIELD_NAME, file);
    Object.entries(dto).forEach(([k, v]) => {
      if (v !== undefined) form.append(k, String(v));
    });
    return requestFormDataWithResponseSchema(
      { method: HTTP_METHODS.POST, url: API_ROUTES.patient.documentsUpload },
      form,
      PatientDocumentResponseDTOSchema,
    );
  },

  uploadPatientPhoto: (
    patientId: string,
    file: File,
  ): Promise<UploadPatientPhotoResponseDTO> => {
    const params = PatientIdParamsDTOSchema.parse({ patientId });
    const form = new FormData();
    form.append(PATIENTS_UPLOAD_FILE_FIELD_NAME, file);
    return requestFormDataWithResponseSchema(
      { method: HTTP_METHODS.POST, url: API_ROUTES.patient.photo(params.patientId) },
      form,
      UploadPatientPhotoResponseDTOSchema,
    );
  },

  deleteDocument: (id: string): Promise<void> => {
    const params = DocumentIdParamsDTOSchema.parse({ documentId: id });
    return requestNoContent({
      method: HTTP_METHODS.DELETE,
      url: API_ROUTES.patient.documentsDelete(params.documentId),
    });
  },

  getAnesthesiaForm: (caseId: string): Promise<CreateAnesthesiaProcedureFormDTO | null> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithSchema(
      { method: HTTP_METHODS.GET, url: API_ROUTES.patient.anesthesia(params.caseId) },
      CreateAnesthesiaProcedureFormDTOSchema.nullable(),
    );
  },

  upsertAnesthesiaForm: (
    caseId: string,
    dto: CreateAnesthesiaProcedureFormDTO,
  ): Promise<CreateAnesthesiaProcedureFormDTO> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithRequestAndResponseSchema(
      { method: HTTP_METHODS.POST, url: API_ROUTES.patient.anesthesia(params.caseId) },
      dto,
      CreateAnesthesiaProcedureFormDTOSchema,
      CreateAnesthesiaProcedureFormDTOSchema,
    );
  },

  getChartsData: (caseId: string): Promise<ChartsDataResponseDTO> => {
    const params = CaseIdParamsDTOSchema.parse({ caseId });
    return requestWithSchema(
      { method: HTTP_METHODS.GET, url: API_ROUTES.patient.chartsData(params.caseId) },
      ChartsDataResponseDTOSchema,
    );
  },

  getDailyPlan: (): Promise<DailyPlanDetailDTO[]> =>
    requestWithSchema({ method: HTTP_METHODS.GET, url: API_ROUTES.patient.dailyPlan.get }, DailyPlanDetailListResponseDTOSchema),

  getCalendarMonth: (
    year: number,
    month: number,
  ): Promise<CalendarMonthResponseDTO> => {
    const params = CalendarMonthParamsDTOSchema.parse({ year, month });
    return requestWithSchema(
      {
        method: HTTP_METHODS.GET,
        url: API_ROUTES.patient.calendar(params.year, params.month),
      },
      CalendarMonthResponseDTOSchema,
    );
  },

  updateDailyPlan: (data: UpdateDailyPlanRequestDTO): Promise<void> =>
    requestNoContent({
      method: HTTP_METHODS.PUT,
      url: API_ROUTES.patient.dailyPlan.update,
      data: UpdateDailyPlanRequestDTOSchema.parse(data),
    }),
};
