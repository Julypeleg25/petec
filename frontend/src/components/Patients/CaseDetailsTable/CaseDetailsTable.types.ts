import type {
  CaseDetailsResponseDTO,
} from "@petec/shared";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
import type { MedicineSelectOptionObj } from "../../MedicinePicker/MedicinePicker.types";
import type { SelectOptionsPickerOptionObj } from "../../SelectOptionsPicker/SelectOptionsPicker.types";

type CaseDailyDetailsMatrix = NonNullable<CaseDetailsResponseDTO["caseDailyDetails"]>;
type CaseDailyDetailsRowDTO = CaseDailyDetailsMatrix[number][number];
type CaseDailyDetailsMedicineItemDTO = CaseDailyDetailsRowDTO["medicines"][number];
type CaseDailyDetailsOptionItemDTO = CaseDailyDetailsRowDTO["foodExtras"][number];
type CaseDailyDetailsExaminationItemDTO = CaseDailyDetailsRowDTO["examinations"][number];

export interface CaseDetailsMedicineCell
  extends MedicineSelectOptionObj,
    Partial<
      Pick<
      CaseDailyDetailsMedicineItemDTO,
      "isGiven" | "isRequired" | "isEditable" | "comment"
      >
    > {}

export interface CaseDetailsOptionCell
  extends SelectOptionsPickerOptionObj,
    Partial<
      Pick<
      CaseDailyDetailsOptionItemDTO,
      "isGiven" | "isRequired" | "isEditable" | "comment"
      >
    >,
    Partial<Pick<CaseDailyDetailsExaminationItemDTO, "exam_value">> {}

type CaseDetailsUiOverrides = {
  id?: CaseDailyDetailsRowDTO["id"];
  date?: CaseDailyDetailsRowDTO["date"];
  fluids: CaseDetailsMedicineCell[];
  medicines: CaseDetailsMedicineCell[];
  foodExtras: CaseDetailsOptionCell[];
  examinations: CaseDetailsOptionCell[];
  procedures: CaseDetailsOptionCell[];
  foodAndWater: CaseDailyDetailsRowDTO["food_and_water"];
  foodAndWater_is_required: CaseDailyDetailsRowDTO["food_and_water_is_required"];
  foodAndWater_is_editable: CaseDailyDetailsRowDTO["food_and_water_is_editable"];
  urineTypeId: CaseDailyDetailsRowDTO["urine_type_id"];
  urineTypeText: string | null;
  urineComments: CaseDailyDetailsRowDTO["urine_comments"];
  urine_is_required: CaseDailyDetailsRowDTO["urine_is_required"];
  urine_is_editable: CaseDailyDetailsRowDTO["urine_is_editable"];
  fecesTypeId: CaseDailyDetailsRowDTO["feces_type_id"];
  fecesTypeText: string | null;
  fecesComments: CaseDailyDetailsRowDTO["feces_comments"];
  feces_is_required: CaseDailyDetailsRowDTO["feces_is_required"];
  feces_is_editable: CaseDailyDetailsRowDTO["feces_is_editable"];
  isTravel: CaseDailyDetailsRowDTO["is_walk_trip"];
  isTravel_is_required: CaseDailyDetailsRowDTO["is_walk_trip_is_required"];
  isTravel_is_editable: CaseDailyDetailsRowDTO["is_walk_trip_is_editable"];
  isBoxClean: CaseDailyDetailsRowDTO["is_box_clean"];
  isBoxClean_is_required: CaseDailyDetailsRowDTO["is_box_clean_is_required"];
  isBoxClean_is_editable: CaseDailyDetailsRowDTO["is_box_clean_is_editable"];
  isRelease: CaseDailyDetailsRowDTO["is_release"];
  isRelease_is_required: CaseDailyDetailsRowDTO["is_release_is_required"];
  isRelease_is_editable: CaseDailyDetailsRowDTO["is_release_is_editable"];
  weigh: CaseDailyDetailsRowDTO["weigh"];
  weigh_is_required: CaseDailyDetailsRowDTO["weigh_is_required"];
  weigh_is_editable: CaseDailyDetailsRowDTO["weigh_is_editable"];
  isPuke: CaseDailyDetailsRowDTO["is_puke"];
  pukeComments: CaseDailyDetailsRowDTO["puke_comments"];
  puke_is_required: CaseDailyDetailsRowDTO["puke_is_required"];
  puke_is_editable: CaseDailyDetailsRowDTO["puke_is_editable"];
  comments: CaseDailyDetailsRowDTO["comments"];
  comments_is_required: CaseDailyDetailsRowDTO["comments_is_required"];
  comments_is_editable: CaseDailyDetailsRowDTO["comments_is_editable"];
  ownerUpdate: CaseDailyDetailsRowDTO["owner_update"];
  ownerUpdate_is_required: CaseDailyDetailsRowDTO["owner_update_is_required"];
  ownerUpdate_is_editable: CaseDailyDetailsRowDTO["owner_update_is_editable"];
};

type CaseDetailsDtoBase = Omit<
  CaseDailyDetailsRowDTO,
  | "id"
  | "date"
  | "fluids"
  | "medicines"
  | "foodExtras"
  | "examinations"
  | "procedures"
  | "food_and_water"
  | "food_and_water_is_required"
  | "food_and_water_is_editable"
  | "urine_type_id"
  | "urine_comments"
  | "urine_is_required"
  | "urine_is_editable"
  | "feces_type_id"
  | "feces_comments"
  | "feces_is_required"
  | "feces_is_editable"
  | "is_walk_trip"
  | "is_walk_trip_is_required"
  | "is_walk_trip_is_editable"
  | "is_box_clean"
  | "is_box_clean_is_required"
  | "is_box_clean_is_editable"
  | "is_release"
  | "is_release_is_required"
  | "is_release_is_editable"
  | "is_puke"
  | "puke_comments"
  | "puke_is_required"
  | "puke_is_editable"
  | "owner_update"
  | "owner_update_is_required"
  | "owner_update_is_editable"
>;

export type CaseDetailsData = CaseDetailsDtoBase & CaseDetailsUiOverrides;

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

export interface CaseDetailsTableProps {
  caseDetailsList: CaseDetailsData[][];
  setCaseDetailsList: Dispatch<SetStateAction<CaseDetailsData[][]>>;
  caseDetailsDataIndex: number;
  handleCellClick: (
    e: MouseEvent<HTMLElement>,
    isEditable: boolean,
  ) => Promise<boolean | null>;
  paintingMode: boolean;
  animalWeight?: string | number | null;
  animalId?: string | number | null;
  selectedStartHour: string;
  setSelectedStartHour: (value: string) => void;
}
