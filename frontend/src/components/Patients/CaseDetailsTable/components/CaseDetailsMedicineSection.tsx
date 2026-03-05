import React from "react";
import type { MedicineSectionType } from "../CaseDetailsTable.constants";
import type { CaseDetailsData } from "../CaseDetailsTable.types";
import { CaseDetailsAddSectionRow } from "./CaseDetailsAddSectionRow";
import { CaseDetailsMedicineRow } from "./CaseDetailsMedicineRow";

interface CaseDetailsMedicineSectionProps {
  sectionType: MedicineSectionType;
  sectionTitle: string;
  caseDetailsList: CaseDetailsData[][];
  caseDetailsDataIndex: number;
  paintingMode: boolean;
  setCaseDetailsList: React.Dispatch<React.SetStateAction<CaseDetailsData[][]>>;
  handleCellClick: (
    e: React.MouseEvent<HTMLElement>,
    isEditable: boolean,
  ) => Promise<boolean | null>;
  onAddClick: (sectionType: MedicineSectionType) => void;
}

export const CaseDetailsMedicineSection = ({
  sectionType,
  sectionTitle,
  caseDetailsList,
  caseDetailsDataIndex,
  paintingMode,
  setCaseDetailsList,
  handleCellClick,
  onAddClick,
}: CaseDetailsMedicineSectionProps) => {
  const selectedRows = caseDetailsList[caseDetailsDataIndex]?.[0]?.[sectionType] ?? [];

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
