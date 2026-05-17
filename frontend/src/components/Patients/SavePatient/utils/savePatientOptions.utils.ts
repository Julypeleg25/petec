import type {
  CaseDetailsResponseDTO,
  SimpleSystemTypeDTO,
  StaffMemberDTO,
} from "@petec/shared";
import type { SelectOptionObj } from "../../../../utils/FormSelect/FormSelect.types";
import type { ChildCaseData } from "../types/savePatient.types";

const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_MINUTE = 60;
const MILLISECONDS_IN_SECOND = 1000;
const MILLISECONDS_IN_DAY =
  HOURS_IN_DAY *
  MINUTES_IN_HOUR *
  SECONDS_IN_MINUTE *
  MILLISECONDS_IN_SECOND;

export const toSelectOptions = (
  items: ReadonlyArray<SimpleSystemTypeDTO>,
): SelectOptionObj[] =>
  items.map((item) => ({ value: item.id, text: item.name }));

export const toStaffOptions = (
  items: ReadonlyArray<StaffMemberDTO>,
): SelectOptionObj[] =>
  items.map((item) => ({ value: item.id, text: item.fullName }));

type MasterCaseDetailWithOptionalCreatedAt =
  CaseDetailsResponseDTO["masterCaseDetails"][number] & {
    createdAt?: string | null;
  };

export const toChildCases = (
  masterCaseDetails: ReadonlyArray<MasterCaseDetailWithOptionalCreatedAt>,
): ChildCaseData[] =>
  masterCaseDetails.map((item) => ({
    caseId: item.caseId,
    patientName: item.patientName,
    patientPhotoName: item.patientPhotoName ?? null,
    visitDate: item.createdAt ?? null,
  }));

export const isCatheterReplacementDue = (
  catheterDateForInput: string | null,
  thresholdDays: number,
): boolean => {
  if (!catheterDateForInput) {
    return false;
  }

  const catheterDate = new Date(catheterDateForInput);
  if (!Number.isFinite(catheterDate.getTime())) {
    return false;
  }

  catheterDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const elapsedDays = Math.floor(
    (today.getTime() - catheterDate.getTime()) / MILLISECONDS_IN_DAY,
  );

  return elapsedDays >= thresholdDays;
};
