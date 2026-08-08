import type {
  CaseDetailsResponseExaminationItemDTO,
  CaseDetailsResponseMedicineItemDTO,
  CaseDetailsResponseOptionItemDTO,
  CaseDetailsResponseRowDTO,
} from "@petec/shared";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import type { SelectOptionsPickerOptionObj } from "../../SelectOptionsPicker/SelectOptionsPicker.types";

export type CaseDailyDetailsRowDTO = CaseDetailsResponseRowDTO;
type CaseDetailsRowBase = Omit<
  CaseDailyDetailsRowDTO,
  "fluids" | "medicines" | "procedures" | "foodExtras" | "examinations"
>;
type CaseDetailsMedicineItemBase = Pick<
  CaseDetailsResponseMedicineItemDTO,
  | "medicineId"
  | "value"
  | "text"
  | "isGiven"
  | "isRequired"
  | "isEditable"
  | "dosageText"
  | "doseAmount"
  | "comment"
>;

interface CaseDetailsMedicinePresentationFields {
  measureUnitTypeId: string | null;
  measureUnitText: string;
  dosageFrequencyId: string | null;
  frequencyText: string;
  routeOfAdministrationId: string | null;
  medicineRouteText: string;
  rangeMax: number;
  rangeMin: number;
  totalDose: number;
  medicineComments: string;
}

interface CaseDetailsCollections {
  fluids: CaseDetailsMedicineCell[];
  medicines: CaseDetailsMedicineCell[];
  procedures: CaseDetailsOptionCell[];
  foodExtras: CaseDetailsOptionCell[];
  examinations: CaseDetailsOptionCell[];
}

export interface CaseDetailsMedicineCell
  extends CaseDetailsMedicineItemBase,
  Partial<CaseDetailsMedicinePresentationFields> { }

export interface CaseDetailsOptionCell
  extends SelectOptionsPickerOptionObj,
  Partial<
    Pick<
      CaseDetailsResponseOptionItemDTO,
      "isGiven" | "isRequired" | "isEditable" | "comment"
    >
  >,
  Partial<Pick<CaseDetailsResponseExaminationItemDTO, "exam_value">> { }

export type CaseDetailsData = CaseDetailsRowBase & CaseDetailsCollections;
export type CaseDetailsStateSetter = Dispatch<
  SetStateAction<CaseDetailsData[][]>
>;
export type CaseDetailsCellClickHandler = (
  e: MouseEvent<HTMLElement>,
  isEditable: boolean,
  isRequired: boolean,
) => Promise<boolean | null>;

export type CaseDetailsInputStateParams = object | string | number;

export type CaseDetailsInputChangeHandler = (
  value: string | number | boolean,
  setStateParams?: CaseDetailsInputStateParams,
  fieldName?: string,
) => void;

export interface AnimalVitals {
  tempRangeMax?: number;
  tempRangeMin?: number;
  pulseRangeMax?: number;
  pulseRangeMin?: number;
  respirationRangeMax?: number;
  respirationRangeMin?: number;
}

export interface CaseDetailsInteractiveStateProps {
  caseDetailsList: CaseDetailsData[][];
  setCaseDetailsList: CaseDetailsStateSetter;
  caseDetailsDataIndex: number;
  handleCellClick: CaseDetailsCellClickHandler;
  paintingMode: boolean;
}

export interface CaseDetailsTableProps extends CaseDetailsInteractiveStateProps {
  animalWeight?: string | number | null;
  animalId?: string | number | null;
}

export type CaseDetailsFieldName = keyof CaseDetailsData;
export type CaseDetailsFieldValue = CaseDetailsData[CaseDetailsFieldName];
export interface CaseDetailsStateParams {
  index: number;
}
export interface CaseDetailsStateParamsCandidate {
  index?: number;
}
export type CaseDetailsMedicineItem = CaseDetailsData["medicines"][number];
