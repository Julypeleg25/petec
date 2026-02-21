import { MedicineSelectOptionObj } from "../../MedicinePicker/MedicinePicker.types";
import { SelectOptionsPickerOptionObj } from "../../SelectOptionsPicker/SelectOptionsPicker.types";
import { DAILY_CASE_TABLE_COL_NUM } from "./CaseDetailsTable";
import { caseDetailsData } from "./CaseDetailsTable.types";

export const getBooleanValueText = (val: any, commentVal?: any) => {
    if (val == null) return null;
    else if (val === true) {
        if (commentVal !== undefined && commentVal !== null && commentVal.length > 0)
            return "כן, " + commentVal;
        else return "כן";
    } else {
        if (commentVal !== undefined && commentVal !== null && commentVal.length > 0)
            return "לא, " + commentVal;
        else return "לא";
    }
};

export const getSelectValueText = (val: any, commentVal?: any) => {
    if (val == null) return null;
    else {
        if (commentVal !== undefined && commentVal !== null && commentVal.length > 0)
            return val + ", " + commentVal;
        else return val;
    }
};

export const getCheckboxesValuesAfterOptionsSelection = (
    selectedOptions: MedicineSelectOptionObj[] | SelectOptionsPickerOptionObj[],
    currentValues: any
) => {
    const obj: Record<string, { isGiven: boolean; isRequired: boolean; isEditable: boolean; comment: string | null }> = {};
    for (let i = 0; i < selectedOptions.length; i++) {
        const currentValue = currentValues[selectedOptions[i].value];

        obj[selectedOptions[i].value] = {
            isGiven: currentValue !== undefined ? currentValue.isGiven : false,
            isRequired: currentValue !== undefined ? currentValue.isRequired : false,
            isEditable: currentValue !== undefined ? currentValue.isEditable : true,
            comment: currentValue !== undefined ? currentValue.comment : null,
        };
    }
    return obj;
};

const frequenciesHours: { [key: string]: number } = {
    BID: 12,
    TID: 8,
    CRI: 8,
    Q4H: 4,
    Q6H: 6,
    bid: 12,
    tid: 8,
    cri: 8,
    q4h: 4,
    q6h: 6,
};

export const getRequiredIndexesByFrequency = (
    frequency: string,
    colIndex: number
): number[] => {
    if (!frequency || frequency == null || !(frequency in frequenciesHours))
        return [colIndex];

    const indexes: number[] = [];
    while (colIndex < DAILY_CASE_TABLE_COL_NUM) {
        indexes.push(colIndex);
        indexes.push(colIndex);
        colIndex += frequenciesHours[frequency] / 2;
    }
    return indexes;
};

export const isValueInRange = (
    value: number | undefined | null,
    min: number | undefined,
    max: number | undefined
) => {
    if (value === undefined || value === null || min === undefined || max === undefined)
        return true;
    return value >= min && value <= max;
};

export const getLatestVitals = (caseDetailsList: caseDetailsData[][]) => {
    let vitalsData = {
        T: { value: 0, dataDetailsIndex: 0, colIndex: 0 },
        P: { value: 0, dataDetailsIndex: 0, colIndex: 0 },
        R: { value: 0, dataDetailsIndex: 0, colIndex: 0 },
    };

    let tempFound = false;
    let pulseFound = false;
    let respirationFound = false;

    for (let i = 0; i < caseDetailsList.length; i++) {
        let caseDetail = caseDetailsList[i] as caseDetailsData[];
        for (let j = caseDetail.length - 1; j > 0; j--) {
            const temp = (caseDetail[j] as caseDetailsData).T;
            const pulse = (caseDetail[j] as caseDetailsData).P;
            const respiration = (caseDetail[j] as caseDetailsData).R;
            if (temp !== undefined && temp !== null && temp !== "" && !tempFound) {
                tempFound = true;
                vitalsData.T = { value: parseFloat(temp), dataDetailsIndex: i, colIndex: j };
            }
            if (pulse !== undefined && pulse !== null && pulse !== "" && !pulseFound) {
                pulseFound = true;
                vitalsData.P = { value: parseFloat(pulse), dataDetailsIndex: i, colIndex: j };
            }
            if (respiration !== undefined && respiration !== null && respiration !== "" && !respirationFound) {
                respirationFound = true;
                vitalsData.R = { value: parseFloat(respiration), dataDetailsIndex: i, colIndex: j };
            }
        }
    }

    return vitalsData;
};
