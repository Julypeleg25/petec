import type { CaseDetailsData } from "../../CaseDetailsTable/CaseDetailsTable.types";
import {
    CASE_GRID_FIRST_DATA_COLUMN_INDEX,
    buildCaseDayRowsByIndexMap,
    getCaseDayPrimaryDataRow,
    getCaseGridExpectedHourByIndex,
    resolveCaseDayStartHour,
    sortCaseDayRowsByIndex,
} from "../../CaseDetailsTable/caseGrid.utils";
import { defaultCaseDailyDataTemplate } from "../types/savePatient.types";
import { cloneCells, toDateKey, toOptionalNumber } from "./savePatientCommon.utils";

export { toOptionalNumber };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T/;
const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

const LAST_CASE_DAY_DATA_COLUMN_INDEX = defaultCaseDailyDataTemplate.length - 1;

const toStartOfDay = (date: Date): Date => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate;
};

const parseDateOrNull = (value?: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const trimmedValue = value.trim();
    if (DATE_PATTERN.test(trimmedValue)) {
        const [year, month, day] = trimmedValue.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    const dateTimePrefixMatch = DATE_TIME_PREFIX_PATTERN.exec(trimmedValue);
    if (dateTimePrefixMatch) {
        const year = Number(dateTimePrefixMatch[1]);
        const month = Number(dateTimePrefixMatch[2]);
        const day = Number(dateTimePrefixMatch[3]);
        return new Date(year, month - 1, day);
    }

    const parsedDate = new Date(trimmedValue);
    if (!Number.isFinite(parsedDate.getTime())) {
        return null;
    }

    return toStartOfDay(parsedDate);
};

export const toLocalDateFromInputValue = (
    value?: string | null,
): Date | undefined => {
    const parsedDate = parseDateOrNull(value);
    return parsedDate ? toStartOfDay(parsedDate) : undefined;
};

export const normalizeCaseDetailsDate = (
    value?: string | null,
): string | null => {
    if (!value) {
        return null;
    }
    const trimmedValue = value.trim();
    if (DATE_PATTERN.test(trimmedValue)) {
        return trimmedValue;
    }
    const dateTimePrefixMatch = DATE_TIME_PREFIX_PATTERN.exec(trimmedValue);
    if (dateTimePrefixMatch) {
        return `${dateTimePrefixMatch[1]}-${dateTimePrefixMatch[2]}-${dateTimePrefixMatch[3]}`;
    }
    const parsed = parseDateOrNull(trimmedValue);
    return parsed ? toDateKey(parsed) : null;
};

export const normalizeCaseDetailsTime = (
    value?: string | null,
): string | null => {
    if (!value) {
        return null;
    }
    const match = TIME_PATTERN.exec(value.trim());
    if (!match) {
        return null;
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const cloneCaseDailyRow = (
    row: CaseDetailsData,
    index: number,
): CaseDetailsData => ({
    ...row,
    index,
    fluids: cloneCells(row.fluids),
    medicines: cloneCells(row.medicines),
    foodExtras: cloneCells(row.foodExtras),
    procedures: cloneCells(row.procedures),
    examinations: cloneCells(row.examinations),
});

const createDefaultCaseDayTemplate = (): CaseDetailsData[] =>
    defaultCaseDailyDataTemplate.map(cloneCaseDailyRow);

export const buildEmptyCaseDailyDetailsTemplate = (): CaseDetailsData[] =>
    createDefaultCaseDayTemplate();

const resetMedicineCells = (
    cells: CaseDetailsData["fluids"],
): CaseDetailsData["fluids"] =>
    cells.map((cell) => ({
        ...cell,
        isGiven: false,
        isRequired: false,
        isEditable: true,
    }));

const resetCheckboxOptionCells = (
    cells: CaseDetailsData["foodExtras"],
): CaseDetailsData["foodExtras"] =>
    cells.map((cell) => ({
        ...cell,
        isGiven: false,
        isRequired: false,
        isEditable: true,
        comment: null,
    }));

const resetExaminationCells = (
    cells: CaseDetailsData["examinations"],
): CaseDetailsData["examinations"] =>
    cells.map((cell) => ({
        ...cell,
        exam_value: null,
        isRequired: false,
        isEditable: true,
        comment: null,
    }));

const normalizeRowIndex = (value: number): number =>
    Number.isInteger(value) && value >= 0
        ? value
        : CASE_GRID_FIRST_DATA_COLUMN_INDEX;

const resolveCaseDayDate = (caseDay: CaseDetailsData[]): string | null => {
    const uniqueDates = new Set(
        caseDay
            .map((row) => normalizeCaseDetailsDate(row.date ?? null))
            .filter((date): date is string => date !== null),
    );

    if (uniqueDates.size !== 1) {
        return null;
    }

    return Array.from(uniqueDates)[0] ?? null;
};

export const hasCaseDayDate = (
    caseDay: CaseDetailsData[],
): boolean => resolveCaseDayDate(caseDay) !== null;

const resolveNewCaseDetailsDate = (
    caseDetailsList: CaseDetailsData[][],
): string => {
    let latestDate: Date | null = null;

    for (const caseDay of caseDetailsList) {
        const rowForDate = getCaseDayPrimaryDataRow(caseDay);
        const parsed = parseDateOrNull(rowForDate?.date);
        if (!parsed) {
            continue;
        }
        if (!latestDate || parsed > latestDate) {
            latestDate = parsed;
        }
    }

    const today = toStartOfDay(new Date());
    if (!latestDate || today > latestDate) {
        return toDateKey(today);
    }

    const nextDate = new Date(latestDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return toDateKey(nextDate);
};

export const normalizeCaseDetailsGridHoursForSave = (
    caseDetailsList: CaseDetailsData[][],
): CaseDetailsData[][] =>
    caseDetailsList.map((caseDay) => {
        const sortedRows = sortCaseDayRowsByIndex(caseDay);
        const startHour = resolveCaseDayStartHour(sortedRows);

        if (startHour === null) {
            return sortedRows;
        }

        return sortedRows.map((row) => {
            const columnIndex = normalizeRowIndex(Number(row.index));
            return {
                ...row,
                time: getCaseGridExpectedHourByIndex(startHour, columnIndex),
            };
        });
    });

export const validateCaseDetailsGridHours = (
    caseDetailsList: CaseDetailsData[][],
): string | null => {
    for (let dayIndex = 0; dayIndex < caseDetailsList.length; dayIndex++) {
        const caseDay = caseDetailsList[dayIndex];
        const rowsByIndex = buildCaseDayRowsByIndexMap(caseDay);
        const normalizedDate = resolveCaseDayDate(Array.from(rowsByIndex.values()));
        if (!normalizedDate) {
            continue;
        }

        const startHour = resolveCaseDayStartHour(caseDay);
        if (startHour === null) {
            return `יש לבחור שעת התחלה תקינה עבור ${normalizedDate}`;
        }

        for (
            let columnIndex = CASE_GRID_FIRST_DATA_COLUMN_INDEX;
            columnIndex <= LAST_CASE_DAY_DATA_COLUMN_INDEX;
            columnIndex++
        ) {
            const normalizedTime = normalizeCaseDetailsTime(
                rowsByIndex.get(columnIndex)?.time ?? null,
            );
            const expectedTime = getCaseGridExpectedHourByIndex(
                startHour,
                columnIndex,
            );

            if (!normalizedTime) {
                return `חסרה שעה בעמודה ${columnIndex} עבור ${normalizedDate}`;
            }
            if (normalizedTime !== expectedTime) {
                return `שעת עמודה ${columnIndex} עבור ${normalizedDate} חייבת להיות ${expectedTime}`;
            }
        }
    }

    return null;
};

export const buildNewCaseDailyDetailsTemplate = (
    caseDetailsList: CaseDetailsData[][],
): CaseDetailsData[] => {
    const sourceRow = caseDetailsList[0]?.[0];
    const defaultCaseDailyData = createDefaultCaseDayTemplate();
    const nextCaseDate = resolveNewCaseDetailsDate(caseDetailsList);

    defaultCaseDailyData.forEach((row) => {
        row.date = nextCaseDate;
    });

    if (!sourceRow) {
        return defaultCaseDailyData;
    }

    defaultCaseDailyData[0] = {
        ...defaultCaseDailyData[0],
        fluids: cloneCells(sourceRow.fluids),
        medicines: cloneCells(sourceRow.medicines),
        foodExtras: cloneCells(sourceRow.foodExtras),
        procedures: cloneCells(sourceRow.procedures),
        examinations: cloneCells(sourceRow.examinations),
    };

    const defaultFluids = resetMedicineCells(sourceRow.fluids);
    const defaultMedicines = resetMedicineCells(sourceRow.medicines);
    const defaultFoodExtras = resetCheckboxOptionCells(sourceRow.foodExtras);
    const defaultProcedures = resetCheckboxOptionCells(sourceRow.procedures);
    const defaultExaminations = resetExaminationCells(sourceRow.examinations);

    for (
        let i = CASE_GRID_FIRST_DATA_COLUMN_INDEX;
        i < defaultCaseDailyData.length;
        i++
    ) {
        defaultCaseDailyData[i] = {
            ...defaultCaseDailyData[i],
            fluids: cloneCells(defaultFluids),
            medicines: cloneCells(defaultMedicines),
            foodExtras: cloneCells(defaultFoodExtras),
            procedures: cloneCells(defaultProcedures),
            examinations: cloneCells(defaultExaminations),
        };
    }

    return defaultCaseDailyData;
};
