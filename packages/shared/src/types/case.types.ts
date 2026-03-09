export interface CaseDetailsMedicineObj {
  medicineId: string;
  name?: string;
  dosageText?: string;
  doseAmount?: number | string;
  measureUnitTypeId?: string;
  dosageFrequencyId?: string;
  routeOfAdministrationId?: string;
  isGiven?: boolean;
  isRequired: boolean;
  isEditable: boolean;
  comment?: string;
}

export interface CaseDetailsOptionsObj {
  typeId: string;
  name?: string;
  isGiven?: boolean;
  isRequired: boolean;
  isEditable: boolean;
  comment?: string;
}

export interface CaseDetailsRow {
  date: string;
  time: string;
  index: number;

  temperature?: number;
  temperatureIsRequired?: boolean;
  temperatureIsEditable?: boolean;

  pulse?: number;
  pulseIsRequired?: boolean;
  pulseIsEditable?: boolean;

  respiration?: number;
  respirationIsRequired?: boolean;
  respirationIsEditable?: boolean;

  urineTypeId?: string;
  urineComments?: string;
  urineIsRequired?: boolean;
  urineIsEditable?: boolean;

  fecesTypeId?: string;
  fecesComments?: string;
  fecesIsRequired?: boolean;
  fecesIsEditable?: boolean;

  isBoxClean?: boolean;
  isBoxCleanIsRequired?: boolean;
  isBoxCleanIsEditable?: boolean;

  isRelease?: boolean;
  isReleaseIsRequired?: boolean;
  isReleaseIsEditable?: boolean;

  isTravel?: boolean;
  isTravelIsRequired?: boolean;
  isTravelIsEditable?: boolean;

  weigh?: number;
  weighIsRequired?: boolean;
  weighIsEditable?: boolean;

  isPuke?: boolean;
  pukeComments?: string;
  pukeIsRequired?: boolean;
  pukeIsEditable?: boolean;

  rowComments?: string;
  rowCommentsIsRequired?: boolean;
  rowCommentsIsEditable?: boolean;

  ownerUpdate?: string;
  ownerUpdateIsRequired?: boolean;
  ownerUpdateIsEditable?: boolean;

  foodGiven?: boolean;
  waterGiven?: boolean;
  foodAndWater?: string | null;
  foodAndWaterIsRequired?: boolean;
  foodAndWaterIsEditable?: boolean;

  fluids: CaseDetailsMedicineObj[];
  medicines: CaseDetailsMedicineObj[];
  procedures: CaseDetailsOptionsObj[];
  examinations: CaseDetailsOptionsObj[];
  foodExtras: CaseDetailsOptionsObj[];
}

export interface PlannedMedicine {
  medicineId: string;
  dosageText?: string;
  doseAmount?: number;
  measureUnitTypeId?: string;
  dosageFrequencyId?: string;
  routeOfAdministrationId?: string;
  startDate?: string;
  endDate?: string;
  isDeleted?: boolean;
  notes?: string;
}

export interface PlannedProcedure {
  procedureTypeId: string;
  plannedProcedureText?: string;
  scheduledFor?: string;
  priority?: string;
  status: string;
  notes?: string;
}

export interface PlannedFoodExtra {
  foodExtraTypeId: string;
  amount?: number;
  measureUnitTypeId?: string;
  frequencyId?: string;
  notes?: string;
}

export interface PlannedExamination {
  examinationTypeId: string;
  scheduledFor?: string;
  notes?: string;
  status?: string;
}

export interface ReleaseMedicine {
  medicineId: string;
  dosageFrequencyId?: string;
  routeOfAdministrationId?: string;
  measureUnitTypeId?: string;
  doseAmount?: number | string;
  notes?: string;
  startDate?: string;
  endDate?: string;
}
