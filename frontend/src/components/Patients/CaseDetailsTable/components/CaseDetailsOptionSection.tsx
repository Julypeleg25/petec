import React from "react";
import type {
  OptionSectionType,
  OptionSystemTypeName,
} from "../CaseDetailsTable.constants";
import type { CaseDetailsData } from "../CaseDetailsTable.types";
import { CaseDetailsAddSectionRow } from "./CaseDetailsAddSectionRow";
import { CaseDetailsOptionRow } from "./CaseDetailsOptionRow";

interface CaseDetailsOptionSectionProps {
  sectionType: OptionSectionType;
  sectionTitle: string;
  inputType: "textarea" | "checkbox";
  systemTypeName: OptionSystemTypeName;
  caseDetailsList: CaseDetailsData[][];
  caseDetailsDataIndex: number;
  paintingMode: boolean;
  setCaseDetailsList: React.Dispatch<React.SetStateAction<CaseDetailsData[][]>>;
  handleCellClick: (
    e: React.MouseEvent<HTMLElement>,
    isEditable: boolean,
  ) => Promise<boolean | null>;
  onAddClick: (
    sectionType: OptionSectionType,
    systemTypeName: OptionSystemTypeName,
  ) => void;
}

export const CaseDetailsOptionSection = ({
  sectionType,
  sectionTitle,
  inputType,
  systemTypeName,
  caseDetailsList,
  caseDetailsDataIndex,
  paintingMode,
  setCaseDetailsList,
  handleCellClick,
  onAddClick,
}: CaseDetailsOptionSectionProps) => {
  const selectedRows = caseDetailsList[caseDetailsDataIndex]?.[0]?.[sectionType] ?? [];

  return (
    <>
      <CaseDetailsAddSectionRow
        title={sectionTitle}
        onAddClick={() => onAddClick(sectionType, systemTypeName)}
      />
      {selectedRows.map((_, rowIndex) => (
        <CaseDetailsOptionRow
          key={`${sectionType}-${rowIndex}`}
          type={sectionType}
          inputType={inputType}
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
