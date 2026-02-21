import { MedicineSelectOptionObj } from "../MedicinePicker/MedicinePicker.types";

export interface ReleasePatientProps {
    caseId: string;
    setShowReleasePatientModal: React.Dispatch<React.SetStateAction<boolean>>;
    isReleased: boolean;
    setIsReleased: React.Dispatch<React.SetStateAction<boolean>>;
    animalWeight: number | undefined;
}

export interface ReleaseFormData {
    caseId: string;
    releaseDate?: string | null;
    stitchesRemovalDate: string | null;
    nextInspectionDate: string | null;
    medicines: MedicineSelectOptionObj[];
}

export interface MedicineApiItem {
    _id: string;
    name: string;
    measureUnitId?: { _id: string; name: string } | null;
    defaultUnit?: string | null;
    rangeMax?: number | null;
    rangeMin?: number | null;
    totalDose?: number | null;
    comments?: string | null;
    routeOfAdministrationId?: { _id: string } | null;
    dosageFrequencyId?: { _id: string } | null;
}
