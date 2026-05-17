import type { ReleasePatientFormDTO } from "@petec/shared";
import type { MedicineSelectOptionObj } from "../MedicinePicker/MedicinePicker.types";

export type ReleaseFormData = ReleasePatientFormDTO & {
    releaseDate?: string | null;
    stitchesRemovalDate: string | null;
    nextInspectionDate: string | null;
    medicines: MedicineSelectOptionObj[];
};
