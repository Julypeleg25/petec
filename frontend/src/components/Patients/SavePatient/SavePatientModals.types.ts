export interface SavePatientModalsProps {
    isEdit: boolean;
    caseIdString: string;
    masterCaseId: string | undefined;
    patientId: number;
    weightKg: number | undefined;
    catheterDate: string | null;

    isReleased: boolean;
    setIsReleased: React.Dispatch<React.SetStateAction<boolean>>;
    showReleasePatientModal: boolean;
    setShowReleasePatientModal: React.Dispatch<React.SetStateAction<boolean>>;

    showDeletePatientCaseModal: boolean;
    setShowDeletePatientCaseModal: React.Dispatch<React.SetStateAction<boolean>>;

    showPatientDocumentsModal: boolean;
    setShowPatientDocumentsModal: React.Dispatch<React.SetStateAction<boolean>>;

    showPatientChartsModal: boolean;
    setShowPatientChartsModal: React.Dispatch<React.SetStateAction<boolean>>;

    showArchiveConfirmationModal: boolean;
    setShowArchiveConfirmationModal: React.Dispatch<React.SetStateAction<boolean>>;
    isArchived: boolean;
    archivePatient: () => void;

    showCatheterReplacementModal: boolean;
    setShowCatheterReplacementModal: React.Dispatch<React.SetStateAction<boolean>>;
}
