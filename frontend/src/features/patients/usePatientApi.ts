import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { patientsApi } from "./patients.api";
import type {
    NewPatientDTO,
    EditPatientDTO,
    ReleasePatientDTO,
    ArchivePatientDTO,
    DeletePatientCaseDTO,
    UploadDocumentDTO,
    CreateAnesthesiaProcedureFormDTO,
} from "@petec/shared";

export const patientKeys = {
    all: ["patients"] as const,
    case: (caseId: string) => ["patients", "case", caseId] as const,
    documents: (patientId: string) => ["patients", "documents", patientId] as const,
    anesthesia: (caseId: string) => ["patients", "anesthesia", caseId] as const,
    releaseData: (caseId: string) => ["patients", "releaseData", caseId] as const,
    charts: (caseId: string) => ["patients", "charts", caseId] as const,
};

export const useCaseDetails = (caseId: string) =>
    useQuery({
        queryKey: patientKeys.case(caseId),
        queryFn: () => patientsApi.getCaseDetails(caseId),
        enabled: !!caseId,
    });

export const usePatientDocuments = (patientId: string) =>
    useQuery({
        queryKey: patientKeys.documents(patientId),
        queryFn: () => patientsApi.getDocuments(patientId),
        enabled: !!patientId,
    });

export const useAnesthesiaForm = (caseId: string) =>
    useQuery({
        queryKey: patientKeys.anesthesia(caseId),
        queryFn: () => patientsApi.getAnesthesiaForm(caseId),
        enabled: !!caseId,
    });

export const useReleasePatientData = (caseId: string) =>
    useQuery({
        queryKey: patientKeys.releaseData(caseId),
        queryFn: () => patientsApi.getReleasePatientData(caseId),
        enabled: !!caseId,
    });

export const useChartsData = (caseId: string) =>
    useQuery({
        queryKey: patientKeys.charts(caseId),
        queryFn: () => patientsApi.getChartsData(caseId),
        enabled: !!caseId,
    });

export const usePatientApi = () => {
    const qc = useQueryClient();

    const createPatient = useMutation({
        mutationFn: (dto: NewPatientDTO) => patientsApi.createPatient(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: patientKeys.all });
            toast.success("המטופל נוסף בהצלחה");
        },
    });

    const updatePatient = useMutation({
        mutationFn: (dto: EditPatientDTO) => patientsApi.updatePatient(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: patientKeys.all });
            toast.success("פרטי המטופל עודכנו בהצלחה");
        },
    });

    const releasePatient = useMutation({
        mutationFn: (dto: ReleasePatientDTO) => patientsApi.releasePatient(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: patientKeys.all });
            toast.success("המטופל שוחרר בהצלחה");
        },
    });

    const deleteCase = useMutation({
        mutationFn: (dto: DeletePatientCaseDTO) => patientsApi.deleteCase(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: patientKeys.all });
            toast.success("הרשומה נמחקה");
        },
    });

    const archivePatient = useMutation({
        mutationFn: (dto: ArchivePatientDTO) => patientsApi.archivePatient(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: patientKeys.all });
            toast.success("המטופל הועבר לארכיון");
        },
    });

    const uploadDocument = useMutation({
        mutationFn: ({ dto, file }: { dto: UploadDocumentDTO; file: File }) =>
            patientsApi.uploadDocument(dto, file),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: patientKeys.documents(variables.dto.patientId) });
            toast.success("המסמך הועלה בהצלחה");
        },
    });

    const deleteDocument = useMutation({
        mutationFn: (id: string) => patientsApi.deleteDocument(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: patientKeys.all });
            toast.success("המסמך נמחק");
        },
    });

    const upsertAnesthesiaForm = useMutation({
        mutationFn: ({ caseId, dto }: { caseId: string; dto: CreateAnesthesiaProcedureFormDTO }) =>
            patientsApi.upsertAnesthesiaForm(caseId, dto),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: patientKeys.anesthesia(variables.caseId) });
            toast.success("טופס הרדמה נשמר בהצלחה");
        },
    });

    const exportCase = useMutation({
        mutationFn: (caseId: string) => patientsApi.exportCase(caseId),
    });

    return {
        createPatient,
        updatePatient,
        releasePatient,
        deleteCase,
        archivePatient,
        uploadDocument,
        deleteDocument,
        upsertAnesthesiaForm,
        exportCase,
    };
};
