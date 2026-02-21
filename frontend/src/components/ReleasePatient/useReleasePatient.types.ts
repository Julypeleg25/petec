export interface UseReleasePatientProps {
  caseId: string;
  isReleased: boolean;
  setIsReleased: (val: boolean) => void;
  setShowReleasePatientModal: (val: boolean) => void;
}
