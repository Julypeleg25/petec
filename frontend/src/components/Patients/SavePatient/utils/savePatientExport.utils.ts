import {
  buildPatientExportFileName,
  type AnimalVitalDTO,
  type ReleasePatientDataResponseDTO,
  type SimpleSystemTypeDTO,
} from "@petec/shared";
import { getFormattedDateFromDBdate } from "../../../../utils/DateFormattingUtil";
import {
  getCaseDayPrimaryDataRow,
  getCaseDayRowByIndex,
} from "../../CaseDetailsTable/caseGrid.utils";
import { type CaseDetailsData } from "../../CaseDetailsTable/CaseDetailsTable.types";
import { mapAnimalVitals } from "../../CaseDetailsTable/hooks/useCaseDetailsData.utils";
import {
  getLatestVitals,
  isValueInRange,
} from "../../CaseDetailsTable/utils/caseDetailsVitals.utils";
import type { NewPatientData } from "../types/savePatient.types";
import { getCaseDateSelectionKey } from "../sections/utils/savePatientSections.utils";

const EMPTY_VALUE = "-";
const EXPORT_CONTAINER_ID = "save-patient-export-container";
const PDF_MARGIN_MM = 0;
const PDF_PAGE_WIDTH_MM = 297;
const PDF_PAGE_HEIGHT_MM = 210;
const PDF_CONTAINER_WIDTH_PX = 1600;
const CANVAS_SCALE = 2;
const HOUR_COLUMNS_COUNT = 13;
const TITLE_ROW_INDEX = 0;

interface CaseExportLookups {
  animalColorText: string;
  animalTypeText: string;
  doctorText: string;
  fecesTypes: SimpleSystemTypeDTO[];
  foodTypeText: string;
  genderText: string;
  insuranceText: string;
  releaseData: ReleasePatientDataResponseDTO;
  urineTypes: SimpleSystemTypeDTO[];
  vitals: AnimalVitalDTO[];
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatTextValue = (
  value: string | number | null | undefined,
  emptyValue = EMPTY_VALUE,
): string => {
  if (value === null || value === undefined) {
    return emptyValue;
  }

  const text = String(value).trim();
  return text.length > 0 ? escapeHtml(text) : emptyValue;
};

const formatRawTextValue = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }

  const text = value.trim();
  return text.length > 0 ? escapeHtml(text) : "";
};

const buildUncheckedCheckbox = (isChecked: boolean | null | undefined): string =>
  `<input type="checkbox"${isChecked ? " checked" : ""}>`;

const buildUneditableOverlay = (isEditable: boolean): string =>
  isEditable
    ? ""
    : `
      <div class="un-editable-cell">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="100" vector-effect="non-scaling-stroke" stroke="red"/>
          <line x1="0" y1="100" x2="100" y2="0" vector-effect="non-scaling-stroke" stroke="red"/>
        </svg>
      </div>
    `;

const buildCellClassName = (isRequired: boolean): string =>
  isRequired ? ' class="required-cell"' : "";

const buildTextCell = (
  value: string,
  isRequired: boolean,
  isEditable: boolean,
): string =>
  `<td${buildCellClassName(isRequired)}>${value}${buildUneditableOverlay(isEditable)}</td>`;

const buildCheckboxCell = (
  isChecked: boolean | null | undefined,
  isRequired: boolean,
  isEditable: boolean,
  comment = "",
): string =>
  `<td${buildCellClassName(isRequired)}>${buildUncheckedCheckbox(isChecked)}${buildUneditableOverlay(isEditable)}${comment}</td>`;

const getCaseDay = (
  caseDetailsList: CaseDetailsData[][],
  selectedCaseDate?: string,
): CaseDetailsData[] => {
  const selectedDay = caseDetailsList.find((caseDay, index) => {
    const primaryRow = getCaseDayPrimaryDataRow(caseDay);
    return (
      primaryRow?.date === selectedCaseDate ||
      getCaseDateSelectionKey(caseDay, index) === selectedCaseDate
    );
  });

  return selectedDay ?? caseDetailsList[0] ?? [];
};

const getHourRows = (caseDay: ReadonlyArray<CaseDetailsData>): Array<CaseDetailsData | undefined> =>
  Array.from({ length: HOUR_COLUMNS_COUNT }, (_, index) =>
    getCaseDayRowByIndex([...caseDay], HOUR_COLUMNS_COUNT - index),
  );

const formatHourLabel = (value: string | undefined): string => {
  if (!value) {
    return "";
  }

  const [hourText] = value.split(":");
  const hourNumber = Number.parseInt(hourText, 10);
  return Number.isFinite(hourNumber) ? `${String(hourNumber)}:00` : "";
};

const getSystemTypeNameById = (
  items: readonly SimpleSystemTypeDTO[],
  id: string | null | undefined,
): string => {
  if (!id) {
    return "";
  }

  return items.find((item) => item.id === id)?.name ?? "";
};

const formatDateValue = (value: string | Date | null | undefined): string => {
  const formatted = getFormattedDateFromDBdate(value);
  return formatted || EMPTY_VALUE;
};

const formatAgeValue = (
  ageYears: number | null | undefined,
  ageMonths: number | null | undefined,
): string => {
  const parts: string[] = [];

  if (ageYears !== null && ageYears !== undefined) {
    parts.push(`${String(ageYears)} שנים`);
  }

  if (ageMonths !== null && ageMonths !== undefined) {
    parts.push(`${String(ageMonths)} חודשים`);
  }

  return parts.length > 0 ? escapeHtml(parts.join(" ")) : EMPTY_VALUE;
};

const formatWeightValue = (weightKg: number | null | undefined): string =>
  weightKg !== null && weightKg !== undefined
    ? escapeHtml(`${String(weightKg)}KG`)
    : EMPTY_VALUE;

const buildSummaryItem = (
  value: string,
  label: string,
  valueAttributes = "",
): string =>
  `<div><span class="export-label">${escapeHtml(label)}:</span><span${valueAttributes}>${value}</span></div>`;

const buildFlagItem = (label: string, isChecked: boolean | undefined): string =>
  `
    <div>
      <input type="checkbox"${isChecked ? " checked" : ""} style="margin-right: 0.5em;">
      <span>${escapeHtml(label)}</span>
    </div>
  `;

const buildMedicineRowTitle = (item: {
  doseAmount?: string | number | null;
  frequencyText?: string;
  measureUnitText?: string;
  medicineRouteText?: string;
  text?: string;
}): string => {
  const medicineName = formatRawTextValue(item.text);
  const doseAmount =
    item.doseAmount !== null && item.doseAmount !== undefined
      ? escapeHtml(String(item.doseAmount))
      : "";
  const measureUnitText = formatRawTextValue(item.measureUnitText);
  const frequencyText = formatRawTextValue(item.frequencyText);
  const medicineRouteText = formatRawTextValue(item.medicineRouteText);

  return [
    `<span class="row-title-medicine-name">${medicineName}</span>`,
    `(${doseAmount}${measureUnitText})`,
    frequencyText,
    medicineRouteText,
  ]
    .filter((part) => part.trim().length > 0)
    .join(" ");
};

const buildTextRow = (
  title: string,
  hourRows: ReadonlyArray<CaseDetailsData | undefined>,
  getCell: (row: CaseDetailsData | undefined) => {
    isEditable: boolean;
    isRequired: boolean;
    value: string;
  },
): string => {
  const cellsHtml = hourRows
    .map((row) => {
      const cell = getCell(row);
      return buildTextCell(cell.value, cell.isRequired, cell.isEditable);
    })
    .join("");

  return `<tr>${cellsHtml}<th class="row-title">${escapeHtml(title)}</th></tr>`;
};

const buildCheckboxRow = (
  title: string,
  hourRows: ReadonlyArray<CaseDetailsData | undefined>,
  getCell: (row: CaseDetailsData | undefined) => {
    comment?: string;
    isChecked: boolean | null | undefined;
    isEditable: boolean;
    isRequired: boolean;
  },
): string => {
  const cellsHtml = hourRows
    .map((row) => {
      const cell = getCell(row);
      const comment = cell.comment ? `<br/>${cell.comment}` : "";
      return buildCheckboxCell(
        cell.isChecked,
        cell.isRequired,
        cell.isEditable,
        comment,
      );
    })
    .join("");

  return `<tr>${cellsHtml}<th class="row-title">${escapeHtml(title)}</th></tr>`;
};

const buildPukeRow = (
  hourRows: ReadonlyArray<CaseDetailsData | undefined>,
): string => {
  const cellsHtml = hourRows
    .map((row) => {
      const comments = formatRawTextValue(row?.pukeComments);
      const value = `${buildUncheckedCheckbox(row?.isPuke)}<p>${comments}</p>`;
      return buildTextCell(
        value,
        row?.pukeIsRequired ?? false,
        row?.pukeIsEditable ?? true,
      );
    })
    .join("");

  return `<tr>${cellsHtml}<th class="row-title">הקאות</th></tr>`;
};

const buildSectionSpacerRow = (title: string): string =>
  `
    <tr class="medicine-empty-row">
      ${Array.from({ length: HOUR_COLUMNS_COUNT }, () => "<td></td>").join("")}
      <th class="row-title">${escapeHtml(title)}</th>
    </tr>
  `;

type DynamicSectionKey =
  | "examinations"
  | "fluids"
  | "foodExtras"
  | "medicines"
  | "procedures";

const getSectionTemplateItems = (
  caseDay: ReadonlyArray<CaseDetailsData>,
  sectionKey: DynamicSectionKey,
): ReadonlyArray<CaseDetailsData[DynamicSectionKey][number]> => {
  const titleRow =
    getCaseDayRowByIndex([...caseDay], TITLE_ROW_INDEX) ?? getCaseDayPrimaryDataRow([...caseDay]);

  if (titleRow && titleRow[sectionKey].length > 0) {
    return titleRow[sectionKey];
  }

  const fallbackRow = caseDay.find((row) => row[sectionKey].length > 0);
  return fallbackRow?.[sectionKey] ?? [];
};

const buildDynamicCheckboxSectionRows = (
  caseDay: ReadonlyArray<CaseDetailsData>,
  hourRows: ReadonlyArray<CaseDetailsData | undefined>,
  sectionKey: "fluids" | "medicines" | "foodExtras" | "procedures",
): string => {
  const templateItems = getSectionTemplateItems(caseDay, sectionKey);

  return templateItems
    .map((templateItem, itemIndex) => {
      const title =
        sectionKey === "fluids" || sectionKey === "medicines"
          ? buildMedicineRowTitle(templateItem)
          : formatRawTextValue(templateItem.text);

      const cellsHtml = hourRows
        .map((row) => {
          const item = row?.[sectionKey][itemIndex];
          const comment =
            sectionKey === "foodExtras" ? "" : formatRawTextValue(item?.comment ?? null);

          return buildCheckboxCell(
            item?.isGiven,
            item?.isRequired ?? false,
            item?.isEditable ?? true,
            comment ? `<br/>${comment}` : "",
          );
        })
        .join("");

      return `<tr>${cellsHtml}<th class="row-title">${title}</th></tr>`;
    })
    .join("");
};

const buildExaminationsSectionRows = (
  caseDay: ReadonlyArray<CaseDetailsData>,
  hourRows: ReadonlyArray<CaseDetailsData | undefined>,
): string => {
  const templateItems = getSectionTemplateItems(caseDay, "examinations");

  return templateItems
    .map((templateItem, itemIndex) => {
      const title = formatRawTextValue(templateItem.text);
      const cellsHtml = hourRows
        .map((row) => {
          const item = row?.examinations[itemIndex];
          return buildTextCell(
            formatRawTextValue(item?.exam_value ?? null),
            item?.isRequired ?? false,
            item?.isEditable ?? true,
          );
        })
        .join("");

      return `<tr>${cellsHtml}<th class="row-title">${title}</th></tr>`;
    })
    .join("");
};

const buildReleaseMedicinesHtml = (
  medicines: ReadonlyArray<ReleasePatientDataResponseDTO["medicines"][number]>,
): string => {
  if (medicines.length === 0) {
    return " - ";
  }

  return medicines
    .map((medicine) => {
      const medicineName = formatTextValue(medicine.text, "");
      const doseParts = [
        `${String(medicine.doseAmount)}${medicine.measureUnitText}`,
        medicine.frequencyText,
        medicine.medicineRouteText,
      ]
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .join(" ");

      return `
        <div><span class="export-label">שם תרופה:</span><span>${medicineName}</span></div>
        <div><span class="export-label">מינון:</span><span>${formatTextValue(doseParts, "")}</span></div>
      `;
    })
    .join("");
};

const buildExportHtml = (
  formData: NewPatientData,
  caseDetailsList: CaseDetailsData[][],
  selectedCaseDate: string | undefined,
  lookups: CaseExportLookups,
): { fileName: string; html: string } => {
  const fileName = buildPatientExportFileName(formData.caseId);
  const caseDay = getCaseDay(caseDetailsList, selectedCaseDate);
  const caseDayIndex = caseDetailsList.findIndex((caseDayItem) => caseDayItem === caseDay);
  const exportDate = formatDateValue(
    getCaseDayPrimaryDataRow(caseDay)?.date,
  );
  const hourRows = getHourRows(caseDay);
  const vitals = mapAnimalVitals(lookups.vitals);
  const latestVitals = getLatestVitals(caseDetailsList);

  const urineTypeById = (id: string | null | undefined): string =>
    getSystemTypeNameById(lookups.urineTypes, id);
  const fecesTypeById = (id: string | null | undefined): string =>
    getSystemTypeNameById(lookups.fecesTypes, id);

  const html = `
    <!doctype html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(fileName)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }

          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            text-align: right;
          }

          .details-table {
            width: 95%;
            margin: 0 auto;
            border-collapse: collapse;
            margin-bottom: 20px;
            direction: ltr;
          }

          th,
          td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
            word-break: break-word;
            padding-top: 0.2em;
            padding-bottom: 0.2em;
            direction: rtl;
            unicode-bidi: plaintext;
          }

          .case-details,
          .case-after-release-details,
          .case-after-release-medicines {
            display: flex;
            flex-wrap: wrap;
            width: 95%;
            margin: 1em auto;
            justify-content: flex-start;
            direction: rtl;
            row-gap: 1em;
          }

          .case-details div,
          .case-after-release-details div,
          .case-after-release-medicines div {
            margin-left: 1em;
            font-size: 1rem;
            display: flex;
            justify-content: flex-start;
            direction: rtl;
            text-align: right;
          }

          .case-details div span:not(.export-label),
          .case-after-release-details div span:not(.export-label),
          .case-after-release-medicines div span:not(.export-label) {
            border-bottom: 2px solid black;
            text-align: center;
            margin-right: 0.35em;
            min-width: 80px;
          }

          .case-after-release-medicines-container {
            display: flex;
            direction: rtl;
            width: 95%;
            margin: 0 auto;
          }

          .case-after-release-medicines-container .case-after-release-medicines {
            margin: 0;
          }

          .case-after-release-medicines-container-title {
            width: 120px;
            text-align: right;
          }

          .row-title {
            min-width: 150px;
            font-weight: 400;
          }

          .row-title-medicine-name {
            font-weight: 600;
          }

          .puke-details p {
            margin-top: 0;
          }

          .medicine-empty-row {
            background-color: #f3f3f3;
          }

          .medicine-empty-row .row-title {
            background-color: white;
          }

          th {
            min-width: 50px;
            font-size: 0.9rem;
          }

          td {
            max-width: 100px;
            font-size: 0.9rem;
            position: relative;
          }

          .required-cell {
            background-color: rgb(255, 0, 0, 0.5);
          }

          .un-editable-cell {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            right: 0;
            z-index: 1;
            background-color: rgb(255, 255, 255, 0.7);
          }
        </style>
      </head>
      <body>
        <div class="case-details">
          ${buildSummaryItem(exportDate, "תאריך")}
          ${buildSummaryItem(formatTextValue(formData.owner.name), "שם הבעלים")}
          ${buildSummaryItem(formatTextValue(formData.owner.phone), "מספר טלפון בעלים")}
          ${buildSummaryItem(formatTextValue(lookups.insuranceText), "ביטוח")}
          ${buildSummaryItem(formatTextValue(formData.caseId), "מספר תיק")}
          ${buildSummaryItem(formatTextValue(formData.name), "שם בע\"ח")}
          ${buildSummaryItem(formatWeightValue(formData.patientSnapshot?.weightKg), "משקל")}
          ${buildSummaryItem(formatTextValue(lookups.genderText), "מין")}
          ${buildSummaryItem(formatTextValue(lookups.animalTypeText), "סוג")}
          ${buildSummaryItem(formatTextValue(lookups.animalColorText), "צבע")}
          ${buildSummaryItem(
            formatAgeValue(
              formData.patientSnapshot?.ageYears,
              formData.patientSnapshot?.ageMonths,
            ),
            "גיל",
            ' style="direction: rtl;"',
          )}
          ${buildSummaryItem(formatTextValue(formData.admission?.hospitalizationReason), "סיבת אשפוז")}
          ${buildSummaryItem(formatTextValue(formData.admission?.allergicComments), "אלרגיה הערות")}
          ${buildSummaryItem(formatTextValue(lookups.foodTypeText), "סוג האוכל")}
          ${buildSummaryItem(formatDateValue(formData.dates?.catheterDate), "תאריך הכנסת קטטר")}
          ${buildSummaryItem(formatDateValue(formData.dates?.procedureDate), "תאריך פרוצדורה")}
          ${buildFlagItem("AMB", formData.flags?.isAMB)}
          ${buildFlagItem("אוושה", formData.flags?.isHeartMurmur)}
          ${buildFlagItem("הרדמה בסיכון", formData.flags?.isRiskAnesthesia)}
          ${buildFlagItem("NPO", formData.flags?.isNPO)}
          ${buildFlagItem("ברחן", formData.flags?.isEscapePotential)}
          ${buildFlagItem("תוקפן", formData.flags?.isAggressive)}
          ${buildFlagItem("סרניה", formData.flags?.isCerenia)}
          ${buildFlagItem("קונבניה", formData.flags?.isConvenia)}
          ${buildFlagItem("אלרגיה", formData.flags?.isAllergic)}
        </div>

        <table class="details-table">
          <tr>
            ${hourRows
              .map((row) => `<th dir="ltr">${formatTextValue(formatHourLabel(row?.time), "")}</th>`)
              .join("")}
            <th></th>
          </tr>

          ${buildTextRow("הערות", hourRows, (row) => ({
            value: formatRawTextValue(row?.rowComments),
            isRequired: row?.rowCommentsIsRequired ?? false,
            isEditable: row?.rowCommentsIsEditable ?? true,
          }))}

          ${buildTextRow("T", hourRows, (row) => {
            const rowIndex = Number(row?.index ?? -1);
            const latestValueOutOfRange = !isValueInRange(
              latestVitals.temperature.value,
              vitals.tempRangeMin,
              vitals.tempRangeMax,
            );

            return {
              value: formatRawTextValue(row?.temperature),
              isRequired:
                (row?.temperatureIsRequired ?? false) ||
                (latestValueOutOfRange &&
                  latestVitals.temperature.dataDetailsIndex === caseDayIndex &&
                  latestVitals.temperature.colIndex === rowIndex),
              isEditable: row?.temperatureIsEditable ?? true,
            };
          })}

          ${buildTextRow("P", hourRows, (row) => {
            const rowIndex = Number(row?.index ?? -1);
            const latestValueOutOfRange = !isValueInRange(
              latestVitals.pulse.value,
              vitals.pulseRangeMin,
              vitals.pulseRangeMax,
            );

            return {
              value: formatRawTextValue(row?.pulse),
              isRequired:
                (row?.pulseIsRequired ?? false) ||
                (latestValueOutOfRange &&
                  latestVitals.pulse.dataDetailsIndex === caseDayIndex &&
                  latestVitals.pulse.colIndex === rowIndex),
              isEditable: row?.pulseIsEditable ?? true,
            };
          })}

          ${buildTextRow("R", hourRows, (row) => {
            const rowIndex = Number(row?.index ?? -1);
            const latestValueOutOfRange = !isValueInRange(
              latestVitals.respiration.value,
              vitals.respirationRangeMin,
              vitals.respirationRangeMax,
            );

            return {
              value: formatRawTextValue(row?.respiration),
              isRequired:
                (row?.respirationIsRequired ?? false) ||
                (latestValueOutOfRange &&
                  latestVitals.respiration.dataDetailsIndex === caseDayIndex &&
                  latestVitals.respiration.colIndex === rowIndex),
              isEditable: row?.respirationIsEditable ?? true,
            };
          })}

          ${buildSectionSpacerRow("נוזלים")}
          ${buildDynamicCheckboxSectionRows(caseDay, hourRows, "fluids")}
          ${buildSectionSpacerRow("תרופות")}
          ${buildDynamicCheckboxSectionRows(caseDay, hourRows, "medicines")}
          ${buildSectionSpacerRow("בדיקות")}
          ${buildExaminationsSectionRows(caseDay, hourRows)}
          ${buildSectionSpacerRow("פרוצדורות")}
          ${buildDynamicCheckboxSectionRows(caseDay, hourRows, "procedures")}
          ${buildSectionSpacerRow("תוספות לאוכל")}
          ${buildDynamicCheckboxSectionRows(caseDay, hourRows, "foodExtras")}

          ${buildTextRow("אוכל + מים", hourRows, (row) => ({
            value: formatRawTextValue(row?.foodAndWater),
            isRequired: row?.foodAndWaterIsRequired ?? false,
            isEditable: row?.foodAndWaterIsEditable ?? true,
          }))}

          ${buildTextRow("שתן", hourRows, (row) => ({
            value: formatRawTextValue(
              row?.urineComments
                ? `${urineTypeById(row.urineTypeId)}, ${row.urineComments}`
                : urineTypeById(row?.urineTypeId),
            ),
            isRequired: row?.urineIsRequired ?? false,
            isEditable: row?.urineIsEditable ?? true,
          }))}

          ${buildTextRow("צואה", hourRows, (row) => ({
            value: formatRawTextValue(
              row?.fecesComments
                ? `${fecesTypeById(row.fecesTypeId)}, ${row.fecesComments}`
                : fecesTypeById(row?.fecesTypeId),
            ),
            isRequired: row?.fecesIsRequired ?? false,
            isEditable: row?.fecesIsEditable ?? true,
          }))}

          ${buildCheckboxRow("טיול", hourRows, (row) => ({
            isChecked: row?.isTravel,
            isRequired: row?.isTravelIsRequired ?? false,
            isEditable: row?.isTravelIsEditable ?? true,
          }))}

          ${buildCheckboxRow("ניקוי ארגז", hourRows, (row) => ({
            isChecked: row?.isBoxClean,
            isRequired: row?.isBoxCleanIsRequired ?? false,
            isEditable: row?.isBoxCleanIsEditable ?? true,
          }))}

          ${buildCheckboxRow("תרופות לשחרור", hourRows, (row) => ({
            isChecked: row?.isRelease,
            isRequired: row?.isReleaseIsRequired ?? false,
            isEditable: row?.isReleaseIsEditable ?? true,
          }))}

          ${buildTextRow("עדכון בעלים", hourRows, (row) => ({
            value: formatRawTextValue(row?.ownerUpdate),
            isRequired: row?.ownerUpdateIsRequired ?? false,
            isEditable: row?.ownerUpdateIsEditable ?? true,
          }))}

          ${buildTextRow("שקילה", hourRows, (row) => ({
            value: formatRawTextValue(row?.weigh),
            isRequired: row?.weighIsRequired ?? false,
            isEditable: row?.weighIsEditable ?? true,
          }))}

          ${buildPukeRow(hourRows)}
        </table>

        <div class="case-after-release-details">
          ${buildSummaryItem(formatDateValue(lookups.releaseData.releaseDate), "תאריך שחרור")}
          ${buildSummaryItem(formatDateValue(lookups.releaseData.nextInspectionDate), "תאריך ביקורת")}
          ${buildSummaryItem(formatDateValue(lookups.releaseData.stitchesRemovalDate), "תאריך הסרת תפרים")}
          ${buildSummaryItem(formatTextValue(lookups.doctorText), "רופא מטפל")}
          ${buildSummaryItem(formatTextValue(formData.admission?.referringDoctor), "רופא מפנה")}
        </div>

        <div class="case-after-release-medicines-container">
          <div class="case-after-release-medicines-container-title">תרופות לשחרור:</div>
          <div class="case-after-release-medicines">${buildReleaseMedicinesHtml(
            lookups.releaseData.medicines,
          )}</div>
        </div>
      </body>
    </html>
  `;

  return { fileName, html };
};

const waitForNextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

const removeExistingExportContainer = (): void => {
  document.getElementById(EXPORT_CONTAINER_ID)?.remove();
};

const createExportContainer = (html: string): HTMLDivElement => {
  removeExistingExportContainer();

  const container = document.createElement("div");
  container.id = EXPORT_CONTAINER_ID;
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${String(PDF_CONTAINER_WIDTH_PX)}px`;
  container.style.background = "#ffffff";
  container.style.zIndex = "-1";
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
};

export const downloadCaseExportPdf = async (
  formData: NewPatientData,
  caseDetailsList: CaseDetailsData[][],
  selectedCaseDate: string | undefined,
  lookups: CaseExportLookups,
): Promise<boolean> => {
  const { fileName, html } = buildExportHtml(
    formData,
    caseDetailsList,
    selectedCaseDate,
    lookups,
  );
  const container = createExportContainer(html);

  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    await waitForNextPaint();

    const canvas = await html2canvas(container, {
      backgroundColor: "#ffffff",
      scale: CANVAS_SCALE,
      useCORS: true,
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const printableWidth = PDF_PAGE_WIDTH_MM - PDF_MARGIN_MM * 2;
    const printableHeight = PDF_PAGE_HEIGHT_MM - PDF_MARGIN_MM * 2;
    const imageHeight = (canvas.height * printableWidth) / canvas.width;
    const imageData = canvas.toDataURL("image/png");

    let remainingHeight = imageHeight;
    let offsetY = PDF_MARGIN_MM;

    pdf.addImage(
      imageData,
      "PNG",
      PDF_MARGIN_MM,
      offsetY,
      printableWidth,
      imageHeight,
    );
    remainingHeight -= printableHeight;

    while (remainingHeight > 0) {
      offsetY = PDF_MARGIN_MM - (imageHeight - remainingHeight);
      pdf.addPage("a4", "landscape");
      pdf.addImage(
        imageData,
        "PNG",
        PDF_MARGIN_MM,
        offsetY,
        printableWidth,
        imageHeight,
      );
      remainingHeight -= printableHeight;
    }

    pdf.save(fileName);
    return true;
  } finally {
    container.remove();
  }
};
