import React from "react";
import type { MedicineSectionType } from "../CaseDetailsTable.constants";
import type { CaseDetailsInteractiveStateProps } from "../CaseDetailsTable.types";
import type { MedicineSelectOptionObj } from "../../../MedicinePicker/MedicinePicker.types";
import { CaseDetailsAddSectionRow } from "./CaseDetailsAddSectionRow";
import { CaseDetailsMedicineRow } from "./CaseDetailsMedicineRow";

interface CaseDetailsMedicineSectionProps extends CaseDetailsInteractiveStateProps {
  sectionType: MedicineSectionType;
  sectionTitle: string;
  catalogMedicines: MedicineSelectOptionObj[];
  onAddClick: (sectionType: MedicineSectionType) => void;
}

export const CaseDetailsMedicineSection = ({
  sectionType,
  sectionTitle,
  catalogMedicines,
  caseDetailsList,
  caseDetailsDataIndex,
  paintingMode,
  setCaseDetailsList,
  handleCellClick,
  onAddClick,
}: CaseDetailsMedicineSectionProps) => {
  const selectedRows =
    caseDetailsList[caseDetailsDataIndex]?.[0]?.[sectionType] ?? [];

  return (
    <>
      <CaseDetailsAddSectionRow
        title={sectionTitle}
        onAddClick={() => onAddClick(sectionType)}
      />
      {selectedRows.map((_, rowIndex) => (
        <CaseDetailsMedicineRow
          key={`${sectionType}-${rowIndex}`}
          type={sectionType}
          rowIndex={rowIndex}
          catalogMedicines={catalogMedicines}
          caseDetailsList={caseDetailsList}
          caseDetailsDataIndex={caseDetailsDataIndex}
          paintingMode={paintingMode}
          setCaseDetailsList={setCaseDetailsList}
          handleCellClick={handleCellClick}
        />
      ))}
    </>
  );
};
