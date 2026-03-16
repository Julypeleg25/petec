import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { patientsApi } from "../patients.api";
import { patientKeys } from "./patient.keys";
import type {
    NewPatientDTO,
    EditPatientDTO,
    ReleasePatientDTO,
    ArchivePatientDTO,
    DeletePatientCaseDTO,
    UploadDocumentDTO,
    CreateAnesthesiaProcedureFormDTO,
} from "@petec/shared";

export const useCaseDetails = (caseId: string, masterCaseId: string) =>
    useQuery({
        queryKey: patientKeys.case(masterCaseId, caseId),
        queryFn: () => patientsApi.getCaseDetails(caseId, masterCaseId),
        enabled: !!caseId && !!masterCaseId,
    });

export const usePatientDocuments = (caseId: string) =>
    useQuery({
        queryKey: patientKeys.documents(caseId),
        queryFn: () => patientsApi.getDocuments(caseId),
        enabled: !!caseId,
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
    const invalidatePatientRelatedLists = (): void => {
        qc.invalidateQueries({ queryKey: patientKeys.all });
        qc.invalidateQueries({ queryKey: ["table"] });
    };

    const createPatient = useMutation({
        mutationFn: (dto: NewPatientDTO) => patientsApi.createPatient(dto),
        onSuccess: () => {
            invalidatePatientRelatedLists();
            toast.success("המטופל נוסף בהצלחה");
        },
    });

    const updatePatient = useMutation({
        mutationFn: (dto: EditPatientDTO) => patientsApi.updatePatient(dto),
        onSuccess: () => {
            invalidatePatientRelatedLists();
            toast.success("פרטי המטופל עודכנו בהצלחה");
        },
    });

    const releasePatient = useMutation({
        mutationFn: (dto: ReleasePatientDTO) => patientsApi.releasePatient(dto),
        onSuccess: () => {
            invalidatePatientRelatedLists();
            toast.success("המטופל שוחרר בהצלחה");
        },
    });

    const deleteCase = useMutation({
        mutationFn: (dto: DeletePatientCaseDTO) => patientsApi.deleteCase(dto),
        onSuccess: () => {
            invalidatePatientRelatedLists();
            toast.success("הרשומה נמחקה");
        },
    });

    const archivePatient = useMutation({
        mutationFn: (dto: ArchivePatientDTO) => patientsApi.archivePatient(dto),
        onSuccess: () => {
            invalidatePatientRelatedLists();
            toast.success("סטטוס הארכיון עודכן בהצלחה");
        },
    });

    const uploadDocument = useMutation({
        mutationFn: ({ dto, file }: { dto: UploadDocumentDTO; file: File }) =>
            patientsApi.uploadDocument(dto, file),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: patientKeys.documents(variables.dto.caseId) });
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

    const uploadPatientPhoto = useMutation({
        mutationFn: ({ patientId, file }: { patientId: string; file: File }) =>
            patientsApi.uploadPatientPhoto(patientId, file),
        onSuccess: () => {
            invalidatePatientRelatedLists();
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
        mutationFn: ({ caseId, date }: { caseId: string; date?: string }) => patientsApi.exportCase(caseId, date),
    });

    return {
        createPatient,
        updatePatient,
        releasePatient,
        deleteCase,
        archivePatient,
        uploadDocument,
        uploadPatientPhoto,
        deleteDocument,
        upsertAnesthesiaForm,
        exportCase,
    };
};
