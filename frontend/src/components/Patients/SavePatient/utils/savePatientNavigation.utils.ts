import { AppRoutes } from "../../../../config/appRoutes";

export type SavePatientModalOpenState =
  | boolean
  | ((prevState: boolean) => boolean);

export function resolveSavePatientModalOpenState(
  nextOpen: SavePatientModalOpenState,
  currentState = true,
) {
  return typeof nextOpen === "function" ? nextOpen(currentState) : nextOpen;
}

export function resolveChildCaseRoute(
  masterCaseId: string | undefined,
  childCaseId: string,
) {
  const resolvedMasterCaseId = masterCaseId ?? childCaseId;
  return AppRoutes.Patients.Details.build(resolvedMasterCaseId, childCaseId);
}
