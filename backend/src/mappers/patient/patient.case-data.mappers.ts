import { Types } from "mongoose";
import { toObjectId } from "../../utils/objectId.utils.js";
import {
    CASE_DATE_FIELDS,
    type EditPatientDTO,
    type NewPatientDTO,
} from "@petec/shared";
import type { ICase } from "../../models/case/index.js";
import type {
    CaseCreateData,
    CaseRefsData,
    CaseUpdateData,
    CaseUpdateSource,
} from "./patient.mappers.types.js";
import {
    toCanonicalJerusalemDate,
    toDateInputString,
} from "../common/common.mappers.utils.js";

type CreateCaseDatesInput = NonNullable<NewPatientDTO["dates"]>;
type UpdateCaseDatesInput = NonNullable<EditPatientDTO["dates"]>;
type MappableCaseDateField = keyof ICase["dates"];

const MAPPABLE_CASE_DATE_FIELDS: readonly MappableCaseDateField[] = [
    CASE_DATE_FIELDS.CATHETER_DATE,
    CASE_DATE_FIELDS.PROCEDURE_DATE,
    CASE_DATE_FIELDS.NEXT_INSPECTION_DATE,
    CASE_DATE_FIELDS.STITCHES_REMOVAL_DATE,
];

const hasOwnCaseDateField = (
    dates: UpdateCaseDatesInput,
    field: MappableCaseDateField,
): boolean => Object.prototype.hasOwnProperty.call(dates, field);

const assignCaseDateValue = (
    target: ICase["dates"],
    key: MappableCaseDateField,
    value: Date | null | undefined,
): void => {
    if (value === null) {
        delete target[key];
        return;
    }

    const normalizedValue = toCanonicalJerusalemDate(value);
    if (normalizedValue) {
        target[key] = normalizedValue;
    }
};

const mapCaseDatesForCreate = (
    dates: CreateCaseDatesInput,
): ICase["dates"] | undefined => {
    const mappedDates: ICase["dates"] = {};

    for (const field of MAPPABLE_CASE_DATE_FIELDS) {
        assignCaseDateValue(mappedDates, field, dates[field]);
    }

    return Object.keys(mappedDates).length > 0 ? mappedDates : undefined;
};

const mapCaseDatesForUpdate = (
    currentDates: ICase["dates"] | undefined,
    dates: UpdateCaseDatesInput,
): ICase["dates"] => {
    const mappedDates: ICase["dates"] = { ...(currentDates ?? {}) };

    for (const field of MAPPABLE_CASE_DATE_FIELDS) {
        if (hasOwnCaseDateField(dates, field)) {
            assignCaseDateValue(mappedDates, field, dates[field]);
        }
    }

    return mappedDates;
};

const toCaseObject = (caseSource: CaseUpdateSource): ICase =>
    typeof caseSource.toObject === "function"
        ? caseSource.toObject()
        : caseSource;

const isProcedureCaseOutsideToday = (
    flags?: ICase["flags"],
    dates?: ICase["dates"],
): boolean => {
    if (flags?.isProcedure !== true) {
        return false;
    }

    const procedureDateKey = toDateInputString(dates?.procedureDate);
    if (!procedureDateKey) {
        return false;
    }

    const todayKey = toDateInputString(new Date());
    return procedureDateKey !== todayKey;
};

const shouldKeepManualUnarchiveOverride = (
    isManuallyUnarchived?: boolean,
    flags?: ICase["flags"],
    dates?: ICase["dates"],
): boolean =>
    isManuallyUnarchived === true && isProcedureCaseOutsideToday(flags, dates);

const shouldAutoArchiveProcedureCase = (
    flags?: ICase["flags"],
    dates?: ICase["dates"],
    isManuallyUnarchived?: boolean,
): boolean =>
    isProcedureCaseOutsideToday(flags, dates) &&
    isManuallyUnarchived !== true;

const ensureTodayProcedureDate = (
    flags?: ICase["flags"],
    dates?: ICase["dates"],
): ICase["dates"] | undefined => {
    if (!flags?.isProcedure || toDateInputString(dates?.procedureDate)) {
        return dates;
    }

    const todayProcedureDate = toCanonicalJerusalemDate(new Date());
    if (!todayProcedureDate) {
        return dates;
    }

    return {
        ...(dates ?? {}),
        procedureDate: todayProcedureDate,
    };
};

export const mapRefsToObjectIds = (
    refs: NonNullable<NewPatientDTO["refs"]>,
): CaseRefsData => {
    const result: CaseRefsData = {};

    if (refs.animalTypeId) {
        result.animalTypeId = toObjectId(refs.animalTypeId);
    }

    if (refs.genderTypeId) {
        result.genderTypeId = toObjectId(refs.genderTypeId);
    }

    if (refs.raceTypeId) {
        result.raceTypeId = toObjectId(refs.raceTypeId);
    }

    if (refs.animalColorId) {
        result.animalColorId = toObjectId(refs.animalColorId);
    }

    if (refs.insuranceTypeId) {
        result.insuranceTypeId = toObjectId(refs.insuranceTypeId);
    }

    if (refs.foodTypeId) {
        result.foodTypeId = toObjectId(refs.foodTypeId);
    }

    return result;
};

export const mapNewPatientDtoToCaseData = (
    dto: NewPatientDTO,
    patientId: Types.ObjectId,
    masterCaseId: Types.ObjectId,
    userId: string,
): CaseCreateData => {
    const caseData: CaseCreateData = {
        patientId,
        masterCaseId,
        serialId: dto.caseId,
        createdByUserId: toObjectId(userId),
    };

    if (dto.doctorUserId) {
        caseData.doctorUserId = toObjectId(dto.doctorUserId);
    }

    if (dto.nurseUserId) {
        caseData.nurseUserId = toObjectId(dto.nurseUserId);
    }

    if (dto.admission) {
        caseData.admission = dto.admission;
    }

    if (dto.patientSnapshot) {
        caseData.patientSnapshot = dto.patientSnapshot;
    }

    if (dto.flags) {
        caseData.flags = dto.flags;
    }

    if (dto.dates) {
        const mappedDates = mapCaseDatesForCreate(dto.dates);
        if (mappedDates) {
            caseData.dates = mappedDates;
        }
    }

    if (dto.comments) {
        caseData.comments = dto.comments;
    }

    if (dto.dailyPlan) {
        caseData.dailyPlan = dto.dailyPlan;
    }

    if (dto.refs) {
        caseData.refs = mapRefsToObjectIds(dto.refs);
    }

    const datesWithProcedureDefault = ensureTodayProcedureDate(
        caseData.flags,
        caseData.dates,
    );
    if (datesWithProcedureDefault) {
        caseData.dates = datesWithProcedureDefault;
    }

    caseData.isArchived = shouldAutoArchiveProcedureCase(
        caseData.flags,
        caseData.dates,
    );

    return caseData;
};

export const mapEditDtoToCaseUpdate = (
    dto: EditPatientDTO,
    existingCase: CaseUpdateSource,
): CaseUpdateData => {
    const caseObject = toCaseObject(existingCase);
    const update: CaseUpdateData = {};

    if (dto.admission) {
        update.admission = { ...caseObject.admission, ...dto.admission };
    }

    if (dto.patientSnapshot) {
        update.patientSnapshot = {
            ...caseObject.patientSnapshot,
            ...dto.patientSnapshot,
        };
    }

    if (dto.flags) {
        update.flags = { ...caseObject.flags, ...dto.flags };
    }

    if (dto.dates) {
        update.dates = mapCaseDatesForUpdate(caseObject.dates, dto.dates);
    }

    if (dto.doctorUserId) {
        update.doctorUserId = toObjectId(dto.doctorUserId);
    }

    if (dto.nurseUserId) {
        update.nurseUserId = toObjectId(dto.nurseUserId);
    }

    if (dto.comments !== undefined) {
        update.comments = dto.comments;
    }

    if (dto.dailyPlan) {
        update.dailyPlan = {
            ...caseObject.dailyPlan,
            ...dto.dailyPlan,
            updatedAt: new Date(),
        };
    }

    if (dto.refs) {
        update.refs = {
            ...caseObject.refs,
            ...mapRefsToObjectIds(dto.refs),
        };
    }

    const nextFlags = update.flags ?? caseObject.flags;
    let nextDates: ICase["dates"] | undefined = update.dates ?? caseObject.dates;
    const datesWithProcedureDefault = ensureTodayProcedureDate(
        nextFlags,
        nextDates,
    );
    if (datesWithProcedureDefault && datesWithProcedureDefault !== nextDates) {
        update.dates = datesWithProcedureDefault;
        nextDates = datesWithProcedureDefault;
    }
    const nextIsManuallyUnarchived = shouldKeepManualUnarchiveOverride(
        caseObject.isManuallyUnarchived,
        nextFlags,
        nextDates,
    );
    update.isManuallyUnarchived = nextIsManuallyUnarchived;
    update.isArchived = shouldAutoArchiveProcedureCase(
        nextFlags,
        nextDates,
        nextIsManuallyUnarchived,
    );

    return update;
};
