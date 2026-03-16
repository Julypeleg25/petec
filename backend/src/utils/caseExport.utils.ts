import type { MedWithPopulatedName, PopulatedNameRef } from "@app-types/patient.types";
import type { IAnimalVitals } from "@models/lookups";
import type {
  CaseExportTemplateData,
  PopulatedCase,
  PopulatedCaseDetailsRow,
  PopulatedExamObj,
  PopulatedMedicineObj,
  PopulatedOptionsObj,
} from "@services/patient/exportService.types";
import { EXPORT_SERVICE_CONSTANTS } from "@services/patient/utils/exportService.utils";
import {
  getLatestVitalRows,
  isValueInRange,
} from "@utils/animalVitals.utils";

type ResolveCaseExportRowsResult = Readonly<{
  dayRowsForGrid: PopulatedCaseDetailsRow[];
  exportDate: string;
}>;

type BuildCaseExportTemplateDataParams = Readonly<{
  caseData: PopulatedCase;
  dayRowsByHour: PopulatedCaseDetailsRow[];
  allGridRows: PopulatedCaseDetailsRow[];
  exportDate: string;
  vitalsMap: Record<string, IAnimalVitals>;
  releaseMedicines: MedWithPopulatedName[];
}>;

const UNEDITABLE_CELL_HTML = `
      <div class="un-editable-cell">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="100" vector-effect="non-scaling-stroke" stroke="red"/>
          <line x1="0" y1="100" x2="100" y2="0" vector-effect="non-scaling-stroke" stroke="red"/>
        </svg>
      </div>
    `;

const RELEASE_MEDICINES_TEMPLATE =
  `<div><span>medicineName</span><span>:שם תרופה</span></div><div><span>doseAmount</span><span>:מינון</span></div>`;

const PLACEHOLDER_PATTERN = /\{[a-zA-Z0-9_]+\}/g;

const buildOptionsCheckboxHtmlTemplate = (): string =>
  `<tr>${Array.from(
    { length: EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE },
    (_, index) => {
      const hour = EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE - index;
      return `<td class="{optionType_optionId_is_required_hour${hour}}"><input type="checkbox" {optionType_optionId_hour${hour}}>{optionType_optionId_is_editable_hour${hour}}<br/>{optionType_optionId_comment_hour${hour}}</td>`;
    },
  ).join("")}<th class="row-title">optionName</th></tr>`;

const buildMedicineCheckboxHtmlTemplate = (): string =>
  `<tr>${Array.from(
    { length: EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE },
    (_, index) => {
      const hour = EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE - index;
      return `<td class="{medicine_optionId_is_required_hour${hour}}"><input type="checkbox" {medicine_optionId_hour${hour}}>{medicine_optionId_is_editable_hour${hour}}<br/>{medicine_optionId_comment_hour${hour}}</td>`;
    },
  ).join("")}<th class="row-title">optionName</th></tr>`;

const buildOptionsTextAreaHtmlTemplate = (): string =>
  `<tr>${Array.from(
    { length: EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE },
    (_, index) => {
      const hour = EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE - index;
      return `<td class="{optionType_optionId_is_required_hour${hour}}">{optionType_optionId_value_hour${hour}}{optionType_optionId_is_editable_hour${hour}}</td>`;
    },
  ).join("")}<th class="row-title">optionName</th></tr>`;

const toLocalizedDate = (value?: Date | string | null): string =>
  value
    ? new Date(value).toLocaleDateString(EXPORT_SERVICE_CONSTANTS.LOCALE)
    : "";

const toRequiredCellClass = (isRequired?: boolean): string =>
  isRequired ? EXPORT_SERVICE_CONSTANTS.REQUIRED_CELL_CLASS : "";

const getAgeText = (years?: number, months?: number): string => {
  if (years === undefined && months === undefined) {
    return "";
  }

  if (years !== undefined && years !== null && months !== undefined && months !== null) {
    return `${years} שנים ו ${months} חודשים`;
  }

  if (years !== undefined && years !== null) {
    return `${years} שנים`;
  }

  if (months !== undefined && months !== null) {
    return `${months} חודשים`;
  }

  return "";
};

const toNamedReferenceName = (value: unknown): string =>
  typeof value === "object" &&
  value !== null &&
  "name" in value &&
  typeof (value as { name?: unknown }).name === "string"
    ? (value as { name: string }).name
    : "";

const getReleaseMedicineMeasureUnitName = (
  medicine: MedWithPopulatedName,
): string => {
  const selectedMeasureUnitName = toNamedReferenceName(medicine.measureUnitTypeId);
  if (selectedMeasureUnitName) {
    return selectedMeasureUnitName;
  }

  if (
    typeof medicine.medicineId !== "object" ||
    medicine.medicineId === null ||
    !("measureUnitTypeId" in medicine.medicineId)
  ) {
    return "";
  }

  return toNamedReferenceName(
    (medicine.medicineId as { measureUnitTypeId?: unknown }).measureUnitTypeId,
  );
};

const buildReleaseMedicinesHtml = (
  releaseMedicines: ReadonlyArray<MedWithPopulatedName>,
): string => {
  let releaseMedsHtml = "";

  releaseMedicines.forEach((medicine) => {
    const medicineName = (medicine.medicineId as PopulatedNameRef)?.name || "";
    const measureUnitName = getReleaseMedicineMeasureUnitName(medicine);
    const doseAmount =
      `${medicine.doseAmount || ""} ${measureUnitName} ${(medicine.dosageFrequencyId as PopulatedNameRef)?.name || ""} ${(medicine.routeOfAdministrationId as PopulatedNameRef)?.name || ""}`;

    releaseMedsHtml += RELEASE_MEDICINES_TEMPLATE
      .replace(/medicineName/g, medicineName)
      .replace(/doseAmount/g, doseAmount);
  });

  return releaseMedsHtml === "" ? " - " : releaseMedsHtml;
};

export const sortCaseGridRows = (
  gridRows: ReadonlyArray<PopulatedCaseDetailsRow>,
): PopulatedCaseDetailsRow[] =>
  [...gridRows].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
  );

export const resolveCaseExportRows = (
  sortedGridRows: ReadonlyArray<PopulatedCaseDetailsRow>,
  targetDate?: string,
): ResolveCaseExportRowsResult => {
  if (!targetDate) {
    return { dayRowsForGrid: [], exportDate: "" };
  }

  const rowsForDate = sortedGridRows.filter((row) => {
    const index = Number(row.index);
    return row.date === targetDate && Number.isFinite(index) && index >= 0;
  });

  if (rowsForDate.length === 0) {
    return { dayRowsForGrid: [], exportDate: targetDate };
  }

  const numericIndexes = rowsForDate
    .map((row) => Number(row.index))
    .filter((index) => Number.isFinite(index));
  const hasZeroIndex = numericIndexes.includes(0);
  const hasMaxIndex = numericIndexes.includes(EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE);
  const offsetIndex = hasZeroIndex && !hasMaxIndex ? 1 : 0;

  const rowsByIndex = new Map<number, PopulatedCaseDetailsRow>();
  rowsForDate.forEach((row) => {
    const index = Number(row.index);
    if (!Number.isInteger(index)) {
      return;
    }

    const normalizedIndex = index + offsetIndex;
    if (
      normalizedIndex < 1 ||
      normalizedIndex > EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE
    ) {
      return;
    }
    rowsByIndex.set(normalizedIndex, row);
  });

  const dayRowsForGrid = Array.from(
    { length: EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE },
    (_, index) => {
      const rowIndex = index + 1;
      return (
        rowsByIndex.get(rowIndex) ?? {
          date: targetDate,
          time: "",
          dateTime: new Date(0),
          index: rowIndex,
          fluids: [],
          medicines: [],
          procedures: [],
          examinations: [],
          foodExtras: [],
        }
      );
    },
  );

  return { dayRowsForGrid, exportDate: targetDate };
};

export const buildCaseExportTemplateData = ({
  caseData,
  dayRowsByHour,
  allGridRows,
  exportDate,
  vitalsMap,
  releaseMedicines,
}: BuildCaseExportTemplateDataParams): CaseExportTemplateData => {
  const latestVitals = getLatestVitalRows(allGridRows);
  const patient = caseData.patientId;
  const optionsCheckboxHtmlTemplate = buildOptionsCheckboxHtmlTemplate();
  const medicineCheckboxHtmlTemplate = buildMedicineCheckboxHtmlTemplate();
  const optionsTextAreaHtmlTemplate = buildOptionsTextAreaHtmlTemplate();

  const data: CaseExportTemplateData = {
    date: exportDate
      ? exportDate.split("-").reverse().join("/")
      : toLocalizedDate(caseData.createdAt),
    ownerName: patient?.owner?.name || "",
    ownerPhoneNumber: patient?.owner?.phone || "",
    insurance: caseData.refs?.insuranceTypeId?.name || "",
    referringDoctor: caseData.admission?.referringDoctor || "",
    caseId: caseData.serialId,
    animalName: patient?.name || "",
    weight: `${caseData.patientSnapshot?.weightKg || ""}KG`,
    gender: caseData.refs?.genderTypeId?.name || "",
    type: caseData.refs?.animalTypeId?.name || "",
    color: caseData.refs?.animalColorId?.name || "",
    age: getAgeText(
      caseData.patientSnapshot?.ageYears,
      caseData.patientSnapshot?.ageMonths,
    ),
    breed: caseData.refs?.raceTypeId?.name || "",
    hospitalizationReason: caseData.admission?.hospitalizationReason || "",
    allergicComments: caseData.admission?.allergicComments || "",
    isAllergic: caseData.flags?.isAllergic,
    foodType: caseData.refs?.foodTypeId?.name || "",
    catheterDate: toLocalizedDate(caseData.dates?.catheterDate),
    procedureDate: toLocalizedDate(caseData.dates?.procedureDate),
    isAMB: caseData.flags?.isAMB,
    isHeartMurmur: caseData.flags?.isHeartMurmur,
    isRiskAnesthesia: caseData.flags?.isRiskAnesthesia,
    isNPO: caseData.flags?.isNPO,
    isEscapePotential: caseData.flags?.isEscapePotential,
    isAggressive: caseData.flags?.isAggressive,
    isCerenia: caseData.flags?.isCerenia,
    isConvenia: caseData.flags?.isConvenia,
    releaseDate: toLocalizedDate(caseData.releaseDate),
    nextInspectionDate: toLocalizedDate(caseData.dates?.nextInspectionDate),
    stitchesRemovalDate: toLocalizedDate(caseData.dates?.stitchesRemovalDate),
    doctor: caseData.doctorUserId
      ? `${caseData.doctorUserId.firstName || ""} ${caseData.doctorUserId.lastName || ""}`
      : "",
    fluids: "",
    medicines: "",
    examinations: "",
    procedures: "",
    foodExtras: "",
    releaseMedicines: "",
  };

  let fluidsHtml = "";
  let medicinesHtml = "";
  let foodExtrasHtml = "";
  let examinationsHtml = "";
  let proceduresHtml = "";

  const allFluids = new Map<string, PopulatedMedicineObj>();
  const allMedicines = new Map<string, PopulatedMedicineObj>();
  const allFoodExtras = new Map<string, PopulatedOptionsObj>();
  const allProcedures = new Map<string, PopulatedOptionsObj>();
  const allExams = new Map<string, PopulatedExamObj>();

  dayRowsByHour.forEach((row) => {
    row.fluids.forEach((fluid) => {
      if (fluid.medicineId?._id) {
        allFluids.set(String(fluid.medicineId._id), fluid);
      }
    });

    row.medicines.forEach((medicine) => {
      if (medicine.medicineId?._id) {
        allMedicines.set(String(medicine.medicineId._id), medicine);
      }
    });

    row.foodExtras.forEach((foodExtra) => {
      if (foodExtra.typeId?._id) {
        allFoodExtras.set(String(foodExtra.typeId._id), foodExtra);
      }
    });

    row.procedures.forEach((procedure) => {
      if (procedure.typeId?._id) {
        allProcedures.set(String(procedure.typeId._id), procedure);
      }
    });

    row.examinations.forEach((exam) => {
      if (exam.typeId?._id) {
        allExams.set(String(exam.typeId._id), exam);
      }
    });
  });

  for (const [id, item] of allFluids) {
    const name =
      `<span class="row-title-medicine-name">${item.medicineId?.name || ""}</span> (${item.doseAmount || ""}${item.measureUnitTypeId?.name || ""}) ${item.dosageFrequencyId?.name || ""} ${item.routeOfAdministrationId?.name || ""}`;
    let rowHtml = medicineCheckboxHtmlTemplate
      .replace(/optionId/g, id)
      .replace(/optionName/g, name);

    for (
      let hour = 1;
      hour <= EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE;
      hour += 1
    ) {
      const row = dayRowsByHour[hour - 1];
      const gridItem = row?.fluids.find((fluid) => String(fluid.medicineId?._id) === id);

      rowHtml = rowHtml
        .replace(`{medicine_${id}_hour${hour}}`, gridItem?.isGiven ? "checked" : "")
        .replace(
          `{medicine_${id}_is_required_hour${hour}}`,
          toRequiredCellClass(gridItem?.isRequired),
        )
        .replace(
          `{medicine_${id}_is_editable_hour${hour}}`,
          gridItem?.isEditable === false ? UNEDITABLE_CELL_HTML : "",
        )
        .replace(`{medicine_${id}_comment_hour${hour}}`, gridItem?.comment || "");
    }

    fluidsHtml += rowHtml;
  }

  for (const [id, item] of allMedicines) {
    const name =
      `<span class="row-title-medicine-name">${item.medicineId?.name || ""}</span> (${item.doseAmount || ""}${item.measureUnitTypeId?.name || ""}) ${item.dosageFrequencyId?.name || ""} ${item.routeOfAdministrationId?.name || ""}`;
    let rowHtml = medicineCheckboxHtmlTemplate
      .replace(/optionId/g, id)
      .replace(/optionName/g, name);

    for (
      let hour = 1;
      hour <= EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE;
      hour += 1
    ) {
      const row = dayRowsByHour[hour - 1];
      const gridItem = row?.medicines.find(
        (medicine) => String(medicine.medicineId?._id) === id,
      );

      rowHtml = rowHtml
        .replace(`{medicine_${id}_hour${hour}}`, gridItem?.isGiven ? "checked" : "")
        .replace(
          `{medicine_${id}_is_required_hour${hour}}`,
          toRequiredCellClass(gridItem?.isRequired),
        )
        .replace(
          `{medicine_${id}_is_editable_hour${hour}}`,
          gridItem?.isEditable === false ? UNEDITABLE_CELL_HTML : "",
        )
        .replace(`{medicine_${id}_comment_hour${hour}}`, gridItem?.comment || "");
    }

    medicinesHtml += rowHtml;
  }

  for (const [id, item] of allFoodExtras) {
    let rowHtml = optionsCheckboxHtmlTemplate
      .replace(/optionId/g, id)
      .replace(/optionName/g, item.typeId?.name || "")
      .replace(/optionType/g, "foodExtra");

    for (
      let hour = 1;
      hour <= EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE;
      hour += 1
    ) {
      const row = dayRowsByHour[hour - 1];
      const gridItem = row?.foodExtras.find(
        (foodExtra) => String(foodExtra.typeId?._id) === id,
      );

      rowHtml = rowHtml
        .replace(`{foodExtra_${id}_hour${hour}}`, gridItem?.isGiven ? "checked" : "")
        .replace(
          `{foodExtra_${id}_is_required_hour${hour}}`,
          toRequiredCellClass(gridItem?.isRequired),
        )
        .replace(
          `{foodExtra_${id}_is_editable_hour${hour}}`,
          gridItem?.isEditable === false ? UNEDITABLE_CELL_HTML : "",
        )
        .replace(`{foodExtra_${id}_comment_hour${hour}}`, "");
    }

    foodExtrasHtml += rowHtml;
  }

  for (const [id, item] of allProcedures) {
    let rowHtml = optionsCheckboxHtmlTemplate
      .replace(/optionId/g, id)
      .replace(/optionName/g, item.typeId?.name || "")
      .replace(/optionType/g, "procedure");

    for (
      let hour = 1;
      hour <= EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE;
      hour += 1
    ) {
      const row = dayRowsByHour[hour - 1];
      const gridItem = row?.procedures.find(
        (procedure) => String(procedure.typeId?._id) === id,
      );

      rowHtml = rowHtml
        .replace(`{procedure_${id}_hour${hour}}`, gridItem?.isGiven ? "checked" : "")
        .replace(
          `{procedure_${id}_is_required_hour${hour}}`,
          toRequiredCellClass(gridItem?.isRequired),
        )
        .replace(
          `{procedure_${id}_is_editable_hour${hour}}`,
          gridItem?.isEditable === false ? UNEDITABLE_CELL_HTML : "",
        )
        .replace(`{procedure_${id}_comment_hour${hour}}`, gridItem?.comment || "");
    }

    proceduresHtml += rowHtml;
  }

  for (const [id, item] of allExams) {
    let rowHtml = optionsTextAreaHtmlTemplate
      .replace(/optionId/g, id)
      .replace(/optionName/g, item.typeId?.name || "")
      .replace(/optionType/g, "examination");

    for (
      let hour = 1;
      hour <= EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE;
      hour += 1
    ) {
      const row = dayRowsByHour[hour - 1];
      const gridItem = row?.examinations.find((exam) => String(exam.typeId?._id) === id);

      rowHtml = rowHtml
        .replace(`{examination_${id}_value_hour${hour}}`, gridItem?.value || "")
        .replace(
          `{examination_${id}_is_required_hour${hour}}`,
          toRequiredCellClass(gridItem?.isRequired),
        )
        .replace(
          `{examination_${id}_is_editable_hour${hour}}`,
          gridItem?.isEditable === false ? UNEDITABLE_CELL_HTML : "",
        );
    }

    examinationsHtml += rowHtml;
  }

  for (
    let hour = 1;
    hour <= EXPORT_SERVICE_CONSTANTS.EXPORT_HOURS_PER_PAGE;
    hour += 1
  ) {
    const row = dayRowsByHour[hour - 1];

    if (row) {
      const hourStr = row.time
        ? row.time.startsWith("0")
          ? row.time.slice(1, 5)
          : row.time.slice(0, 5)
        : "";

      data[`hour${hour}`] = hourStr;
      data[`temp_hour${hour}`] = row.temperature || "";
      data[`temp_is_required_hour${hour}`] =
        row.temperatureIsRequired ||
        (row === latestVitals.TRow &&
          vitalsMap.T &&
          !isValueInRange(row.temperature, vitalsMap.T.rangeMin, vitalsMap.T.rangeMax))
          ? EXPORT_SERVICE_CONSTANTS.REQUIRED_CELL_CLASS
          : "";
      data[`temp_is_editable_hour${hour}`] =
        row.temperatureIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`pulse_hour${hour}`] = row.pulse || "";
      data[`pulse_is_required_hour${hour}`] =
        row.pulseIsRequired ||
        (row === latestVitals.PRow &&
          vitalsMap.P &&
          !isValueInRange(row.pulse, vitalsMap.P.rangeMin, vitalsMap.P.rangeMax))
          ? EXPORT_SERVICE_CONSTANTS.REQUIRED_CELL_CLASS
          : "";
      data[`pulse_is_editable_hour${hour}`] =
        row.pulseIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`respiration_hour${hour}`] = row.respiration || "";
      data[`respiration_is_required_hour${hour}`] =
        row.respirationIsRequired ||
        (row === latestVitals.RRow &&
          vitalsMap.R &&
          !isValueInRange(
            row.respiration,
            vitalsMap.R.rangeMin,
            vitalsMap.R.rangeMax,
          ))
          ? EXPORT_SERVICE_CONSTANTS.REQUIRED_CELL_CLASS
          : "";
      data[`respiration_is_editable_hour${hour}`] =
        row.respirationIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`food_and_water_hour${hour}`] = row.foodAndWater || "";
      data[`food_and_water_is_required_hour${hour}`] = toRequiredCellClass(
        row.foodAndWaterIsRequired,
      );
      data[`food_and_water_is_editable_hour${hour}`] =
        row.foodAndWaterIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`comments_hour${hour}`] = row.rowComments || "";
      data[`comments_is_required_hour${hour}`] = toRequiredCellClass(
        row.rowCommentsIsRequired,
      );
      data[`comments_is_editable_hour${hour}`] =
        row.rowCommentsIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`urine_hour${hour}`] = row.urineComments
        ? `${row.urineTypeId?.name || ""}, ${row.urineComments}`
        : row.urineTypeId?.name || "";
      data[`urine_is_required_hour${hour}`] = toRequiredCellClass(row.urineIsRequired);
      data[`urine_is_editable_hour${hour}`] =
        row.urineIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`feces_hour${hour}`] = row.fecesComments
        ? `${row.fecesTypeId?.name || ""}, ${row.fecesComments}`
        : row.fecesTypeId?.name || "";
      data[`feces_is_required_hour${hour}`] = toRequiredCellClass(row.fecesIsRequired);
      data[`feces_is_editable_hour${hour}`] =
        row.fecesIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`is_travel_hour${hour}`] = row.isTravel ? "checked" : "";
      data[`is_travel_is_required_hour${hour}`] = toRequiredCellClass(
        row.isTravelIsRequired,
      );
      data[`is_travel_is_editable_hour${hour}`] =
        row.isTravelIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`is_box_clean_hour${hour}`] = row.isBoxClean ? "checked" : "";
      data[`is_box_clean_is_required_hour${hour}`] = toRequiredCellClass(
        row.isBoxCleanIsRequired,
      );
      data[`is_box_clean_is_editable_hour${hour}`] =
        row.isBoxCleanIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`is_release_hour${hour}`] = row.isRelease ? "checked" : "";
      data[`is_release_is_required_hour${hour}`] = toRequiredCellClass(
        row.isReleaseIsRequired,
      );
      data[`is_release_is_editable_hour${hour}`] =
        row.isReleaseIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`weigh_hour${hour}`] = row.weigh || "";
      data[`weigh_is_required_hour${hour}`] = toRequiredCellClass(row.weighIsRequired);
      data[`weigh_is_editable_hour${hour}`] =
        row.weighIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`is_puke_hour${hour}`] = row.isPuke ? "checked" : "";
      data[`puke_comments_hour${hour}`] = row.pukeComments || "";
      data[`puke_is_required_hour${hour}`] = toRequiredCellClass(row.pukeIsRequired);
      data[`puke_is_editable_hour${hour}`] =
        row.pukeIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      data[`owner_update_hour${hour}`] = row.ownerUpdate || "";
      data[`owner_update_is_required_hour${hour}`] = toRequiredCellClass(
        row.ownerUpdateIsRequired,
      );
      data[`owner_update_is_editable_hour${hour}`] =
        row.ownerUpdateIsEditable === false ? UNEDITABLE_CELL_HTML : "";

      continue;
    }

    data[`hour${hour}`] = "";
    data[`temp_hour${hour}`] = "";
    data[`temp_is_required_hour${hour}`] = "";
    data[`temp_is_editable_hour${hour}`] = "";
    data[`pulse_hour${hour}`] = "";
    data[`pulse_is_required_hour${hour}`] = "";
    data[`pulse_is_editable_hour${hour}`] = "";
    data[`respiration_hour${hour}`] = "";
    data[`respiration_is_required_hour${hour}`] = "";
    data[`respiration_is_editable_hour${hour}`] = "";
    data[`food_and_water_hour${hour}`] = "";
    data[`food_and_water_is_required_hour${hour}`] = "";
    data[`food_and_water_is_editable_hour${hour}`] = "";
    data[`comments_hour${hour}`] = "";
    data[`comments_is_required_hour${hour}`] = "";
    data[`comments_is_editable_hour${hour}`] = "";
    data[`urine_hour${hour}`] = "";
    data[`urine_is_required_hour${hour}`] = "";
    data[`urine_is_editable_hour${hour}`] = "";
    data[`feces_hour${hour}`] = "";
    data[`feces_is_required_hour${hour}`] = "";
    data[`feces_is_editable_hour${hour}`] = "";
    data[`is_travel_hour${hour}`] = "";
    data[`is_travel_is_required_hour${hour}`] = "";
    data[`is_travel_is_editable_hour${hour}`] = "";
    data[`is_box_clean_hour${hour}`] = "";
    data[`is_box_clean_is_required_hour${hour}`] = "";
    data[`is_box_clean_is_editable_hour${hour}`] = "";
    data[`is_release_hour${hour}`] = "";
    data[`is_release_is_required_hour${hour}`] = "";
    data[`is_release_is_editable_hour${hour}`] = "";
    data[`weigh_hour${hour}`] = "";
    data[`weigh_is_required_hour${hour}`] = "";
    data[`weigh_is_editable_hour${hour}`] = "";
    data[`is_puke_hour${hour}`] = "";
    data[`puke_comments_hour${hour}`] = "";
    data[`puke_is_required_hour${hour}`] = "";
    data[`puke_is_editable_hour${hour}`] = "";
    data[`owner_update_hour${hour}`] = "";
    data[`owner_update_is_required_hour${hour}`] = "";
    data[`owner_update_is_editable_hour${hour}`] = "";
  }

  data.fluids = fluidsHtml.replace(PLACEHOLDER_PATTERN, "");
  data.medicines = medicinesHtml.replace(PLACEHOLDER_PATTERN, "");
  data.foodExtras = foodExtrasHtml.replace(PLACEHOLDER_PATTERN, "");
  data.procedures = proceduresHtml.replace(PLACEHOLDER_PATTERN, "");
  data.examinations = examinationsHtml.replace(PLACEHOLDER_PATTERN, "");
  data.releaseMedicines = buildReleaseMedicinesHtml(releaseMedicines);

  return data;
};
