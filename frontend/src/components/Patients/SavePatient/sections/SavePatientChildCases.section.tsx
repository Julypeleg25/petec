import {
  getPatientImageSrc,
  handlePatientImageLoadError,
} from "../../../../features/patients/utils/patientImage.utils";
import { getFormattedDateFromDBdate } from "../../../../utils/DateFormattingUtil";
import type { ChildCaseData } from "../types/savePatient.types";

interface SavePatientChildCasesSectionProps {
  childCases: ChildCaseData[];
  currentCaseId?: string;
  onSelectChildCase: (childCaseId: string) => void;
}

function SavePatientChildCasesSection({
  childCases,
  currentCaseId,
  onSelectChildCase,
}: SavePatientChildCasesSectionProps) {
  const formatVisitDate = (value: string | null): string =>
    getFormattedDateFromDBdate(value) || "-";

  if (childCases.length <= 1) {
    return null;
  }

  return (
    <div className="child-cases-container">
      {childCases.map((childCase) => (
        <div
          key={childCase.caseId}
          className={`child-case ${childCase.caseId === currentCaseId ? "child-case-disabled" : ""}`}
          onClick={() => {
            if (childCase.caseId !== currentCaseId) {
              onSelectChildCase(childCase.caseId);
            }
          }}
        >
          <img
            className="child-case-img"
            src={getPatientImageSrc(childCase.patientPhotoName)}
            onError={handlePatientImageLoadError}
            alt="child-case"
          />
          <div className="child-case-name">{childCase.patientName}</div>
          <div className="child-case-visit-date">
            {formatVisitDate(childCase.visitDate)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SavePatientChildCasesSection;
