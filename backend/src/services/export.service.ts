import { logger } from "@config/logger";
import { caseRepository } from "@repositories/case.repository";
import { NotFoundError } from "@constants/error.constants";
import type { ICase } from "@models/Case";
import { EXPORT_SERVICE_CONSTANTS } from "@services/utils/export.service.utils";
import { createPdf } from "@utils/puppeteer.utils";
import type { PopulatedNameRef, PopulatedPatient } from "@app-types/patient.types";
import { AnimalVitalsModel } from "@models/Lookups";
import type { IAnimalVitals } from "@models/Lookups.types";
import type {
    CaseExportTemplateData,
    PopulatedCase,
    PopulatedCaseDetailsRow,
    PopulatedExamObj,
    PopulatedMedicineObj,
    PopulatedOptionsObj,
} from "@services/export.service.types";

const MODULE = EXPORT_SERVICE_CONSTANTS.MODULE;

export class ExportService {
    async exportCase(caseId: string, targetDate?: string): Promise<{ caseData: ICase; pdfPath: string }> {
        const caseDoc = await caseRepository.findByIdPopulated(caseId);
        if (!caseDoc) {
            throw new NotFoundError("Case not found for export");
        }

        const caseData = caseDoc.toObject() as PopulatedCase;
        const patient = caseData.patientId;

        const animalTypeId = caseData.refs.animalTypeId?._id;
        const animalVitals = animalTypeId ? await AnimalVitalsModel.find({ animalTypeId: String(animalTypeId) }).lean() : [];
        const vitalsMap: Record<string, IAnimalVitals> = {};
        animalVitals.forEach(v => {
            if (v.vitalsType) vitalsMap[v.vitalsType] = v;
        });

        const gridRows = Array.isArray(caseData.caseDetailsGrid) ? caseData.caseDetailsGrid : [];
        const sortedGridRows = [...gridRows].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

        let dayRowsForGrid: PopulatedCaseDetailsRow[] = [];
        let exportDate = targetDate || "";

        if (exportDate) {
            const lastRowIndex = [...sortedGridRows].reverse().findIndex(r => r.date === exportDate);
            if (lastRowIndex !== -1) {
                const actualIndex = sortedGridRows.length - 1 - lastRowIndex;
                const startIndex = Math.max(0, actualIndex - 12);
                dayRowsForGrid = sortedGridRows.slice(startIndex, startIndex + 13);
            }
        }

        if (dayRowsForGrid.length === 0) {
            dayRowsForGrid = sortedGridRows.slice(-13);
            exportDate = dayRowsForGrid[dayRowsForGrid.length - 1]?.date || "";
        }

        const templateData = this.mapToTemplateData(caseData, patient, dayRowsForGrid, sortedGridRows, exportDate, vitalsMap);

        const fileName = `patientCase_${caseData.serialId}`;
        const pdfPath = await createPdf<CaseExportTemplateData>("CaseDetailsTemplate.hbs", templateData, fileName);

        logger.info("Case exported to PDF", {
            module: MODULE,
            case_id: caseId,
            case_serial_id: caseData.serialId,
            date: exportDate,
            pdf_path: pdfPath,
        });

        return { caseData: caseData as ICase, pdfPath };
    }

    private mapToTemplateData(
        caseData: PopulatedCase,
        patient: PopulatedPatient | undefined,
        dayRowsByHour: PopulatedCaseDetailsRow[],
        allGridRows: PopulatedCaseDetailsRow[],
        exportDate: string,
        vitalsMap: Record<string, IAnimalVitals>
    ): CaseExportTemplateData {
        const latestVitals = this.getLatestVitals(allGridRows);

        const data: CaseExportTemplateData = {
            date: exportDate ? exportDate.split("-").reverse().join("/") : (caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString("he-IL") : ""),
            ownerName: patient?.owner?.name || "",
            ownerPhoneNumber: patient?.owner?.phone || "",
            insurance: caseData.refs?.insuranceTypeId?.name || "",
            referringDoctor: caseData.admission?.referringDoctor || "",
            caseId: caseData.serialId,
            animalName: patient?.name || "",
            weight: (caseData.patientSnapshot?.weightKg || "") + "KG",
            gender: caseData.refs?.genderTypeId?.name || "",
            type: caseData.refs?.animalTypeId?.name || "",
            color: caseData.refs?.animalColorId?.name || "",
            age: this.getAgeText(caseData.patientSnapshot?.ageYears, caseData.patientSnapshot?.ageMonths),
            breed: caseData.refs?.raceTypeId?.name || "",
            hospitalizationReason: caseData.admission?.hospitalizationReason || "",
            allergicComments: caseData.admission?.allergicComments || "",
            isAllergic: caseData.flags?.isAllergic,
            foodType: caseData.refs?.foodTypeId?.name || "",
            catheterDate: caseData.dates?.catheterDate ? new Date(caseData.dates.catheterDate).toLocaleDateString("he-IL") : "",
            procedureDate: caseData.dates?.procedureDate ? new Date(caseData.dates.procedureDate).toLocaleDateString("he-IL") : "",
            isAMB: caseData.flags?.isAMB,
            isHeartMurmur: caseData.flags?.isHeartMurmur,
            isRiskAnesthesia: caseData.flags?.isRiskAnesthesia,
            isNPO: caseData.flags?.isNPO,
            isEscapePotential: caseData.flags?.isEscapePotential,
            isAggressive: caseData.flags?.isAggressive,
            isCerenia: caseData.flags?.isCerenia,
            isConvenia: caseData.flags?.isConvenia,
            releaseDate: caseData.releaseDate ? new Date(caseData.releaseDate).toLocaleDateString("he-IL") : "",
            nextInspectionDate: caseData.dates?.nextInspectionDate ? new Date(caseData.dates.nextInspectionDate).toLocaleDateString("he-IL") : "",
            stitchesRemovalDate: caseData.dates?.stitchesRemovalDate ? new Date(caseData.dates.stitchesRemovalDate).toLocaleDateString("he-IL") : "",
            doctor: caseData.doctorUserId ? `${caseData.doctorUserId.firstName || ""} ${caseData.doctorUserId.lastName || ""}` : "",
            fluids: "",
            medicines: "",
            examinations: "",
            procedures: "",
            foodExtras: "",
            releaseMedicines: "",
        };

        const unEditableCellHtml = `
      <div class="un-editable-cell">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="100" vector-effect="non-scaling-stroke" stroke="red"/>
          <line x1="0" y1="100" x2="100" y2="0" vector-effect="non-scaling-stroke" stroke="red"/>
        </svg>
      </div>
    `;

        const optionsCheckboxHtmlTemplate = `<tr>${Array.from({ length: 13 }, (_, i) => {
            const hour = 13 - i;
            return `<td class="{optionType_optionId_is_required_hour${hour}}"><input type="checkbox" {optionType_optionId_hour${hour}}>{optionType_optionId_is_editable_hour${hour}}<br/>{optionType_optionId_comment_hour${hour}}</td>`;
        }).join("")}<th class="row-title">optionName</th></tr>`;

        const medicineCheckboxHtmlTemplate = `<tr>${Array.from({ length: 13 }, (_, i) => {
            const hour = 13 - i;
            return `<td class="{medicine_optionId_is_required_hour${hour}}"><input type="checkbox" {medicine_optionId_hour${hour}}>{medicine_optionId_is_editable_hour${hour}}<br/>{medicine_optionId_comment_hour${hour}}</td>`;
        }).join("")}<th class="row-title">optionName</th></tr>`;

        const optionsTextAreaHtmlTemplate = `<tr>${Array.from({ length: 13 }, (_, i) => {
            const hour = 13 - i;
            return `<td class="{optionType_optionId_is_required_hour${hour}}">{optionType_optionId_value_hour${hour}}{optionType_optionId_is_editable_hour${hour}}</td>`;
        }).join("")}<th class="row-title">optionName</th></tr>`;

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

        dayRowsByHour.forEach(row => {
            row.fluids.forEach(f => { if (f.medicineId?._id) allFluids.set(String(f.medicineId._id), f); });
            row.medicines.forEach(m => { if (m.medicineId?._id) allMedicines.set(String(m.medicineId._id), m); });
            row.foodExtras.forEach(fe => { if (fe.typeId?._id) allFoodExtras.set(String(fe.typeId._id), fe); });
            row.procedures.forEach(p => { if (p.typeId?._id) allProcedures.set(String(p.typeId._id), p); });
            row.examinations.forEach(e => { if (e.typeId?._id) allExams.set(String(e.typeId._id), e); });
        });

        for (const [id, item] of allFluids) {
            const name = `<span class="row-title-medicine-name">${item.medicineId?.name || ""}</span> (${item.doseAmount || ""}${item.measureUnitTypeId?.name || ""}) ${item.dosageFrequencyId?.name || ""} ${item.routeOfAdministrationId?.name || ""}`;
            let rowHtml = medicineCheckboxHtmlTemplate.replace(/optionId/g, id).replace(/optionName/g, name);
            for (let i = 1; i <= 13; i++) {
                const row = dayRowsByHour[dayRowsByHour.length - i];
                const gridItem = row?.fluids.find(f => String(f.medicineId?._id) === id);
                rowHtml = rowHtml
                    .replace(`{medicine_${id}_hour${i}}`, gridItem?.isGiven ? "checked" : "")
                    .replace(`{medicine_${id}_is_required_hour${i}}`, gridItem?.isRequired ? "required-cell" : "")
                    .replace(`{medicine_${id}_is_editable_hour${i}}`, gridItem?.isEditable === false ? unEditableCellHtml : "")
                    .replace(`{medicine_${id}_comment_hour${i}}`, gridItem?.comment || "");
            }
            fluidsHtml += rowHtml;
        }

        for (const [id, item] of allMedicines) {
            const name = `<span class="row-title-medicine-name">${item.medicineId?.name || ""}</span> (${item.doseAmount || ""}${item.measureUnitTypeId?.name || ""}) ${item.dosageFrequencyId?.name || ""} ${item.routeOfAdministrationId?.name || ""}`;
            let rowHtml = medicineCheckboxHtmlTemplate.replace(/optionId/g, id).replace(/optionName/g, name);
            for (let i = 1; i <= 13; i++) {
                const row = dayRowsByHour[dayRowsByHour.length - i];
                const gridItem = row?.medicines.find(m => String(m.medicineId?._id) === id);
                rowHtml = rowHtml
                    .replace(`{medicine_${id}_hour${i}}`, gridItem?.isGiven ? "checked" : "")
                    .replace(`{medicine_${id}_is_required_hour${i}}`, gridItem?.isRequired ? "required-cell" : "")
                    .replace(`{medicine_${id}_is_editable_hour${i}}`, gridItem?.isEditable === false ? unEditableCellHtml : "")
                    .replace(`{medicine_${id}_comment_hour${i}}`, gridItem?.comment || "");
            }
            medicinesHtml += rowHtml;
        }

        for (const [id, item] of allFoodExtras) {
            let rowHtml = optionsCheckboxHtmlTemplate.replace(/optionId/g, id).replace(/optionName/g, item.name || "").replace(/optionType/g, "foodExtra");
            for (let i = 1; i <= 13; i++) {
                const row = dayRowsByHour[dayRowsByHour.length - i];
                const gridItem = row?.foodExtras.find(fe => String(fe.typeId?._id) === id);
                rowHtml = rowHtml
                    .replace(`{foodExtra_${id}_hour${i}}`, gridItem?.isGiven ? "checked" : "")
                    .replace(`{foodExtra_${id}_is_required_hour${i}}`, gridItem?.isRequired ? "required-cell" : "")
                    .replace(`{foodExtra_${id}_is_editable_hour${i}}`, gridItem?.isEditable === false ? unEditableCellHtml : "")
                    .replace(`{foodExtra_${id}_comment_hour${i}}`, gridItem?.comment || "");
            }
            foodExtrasHtml += rowHtml;
        }

        for (const [id, item] of allProcedures) {
            let rowHtml = optionsCheckboxHtmlTemplate.replace(/optionId/g, id).replace(/optionName/g, item.name || "").replace(/optionType/g, "procedure");
            for (let i = 1; i <= 13; i++) {
                const row = dayRowsByHour[dayRowsByHour.length - i];
                const gridItem = row?.procedures.find(p => String(p.typeId?._id) === id);
                rowHtml = rowHtml
                    .replace(`{procedure_${id}_hour${i}}`, gridItem?.isGiven ? "checked" : "")
                    .replace(`{procedure_${id}_is_required_hour${i}}`, gridItem?.isRequired ? "required-cell" : "")
                    .replace(`{procedure_${id}_is_editable_hour${i}}`, gridItem?.isEditable === false ? unEditableCellHtml : "")
                    .replace(`{procedure_${id}_comment_hour${i}}`, gridItem?.comment || "");
            }
            proceduresHtml += rowHtml;
        }

        for (const [id, item] of allExams) {
            let rowHtml = optionsTextAreaHtmlTemplate.replace(/optionId/g, id).replace(/optionName/g, item.name || "").replace(/optionType/g, "examination");
            for (let i = 1; i <= 13; i++) {
                const row = dayRowsByHour[dayRowsByHour.length - i];
                const gridItem = row?.examinations.find(e => String(e.typeId?._id) === id);
                rowHtml = rowHtml
                    .replace(`{examination_${id}_value_hour${i}}`, gridItem?.value || "")
                    .replace(`{examination_${id}_is_required_hour${i}}`, gridItem?.isRequired ? "required-cell" : "")
                    .replace(`{examination_${id}_is_editable_hour${i}}`, gridItem?.isEditable === false ? unEditableCellHtml : "");
            }
            examinationsHtml += rowHtml;
        }

        for (let i = 1; i <= 13; i++) {
            const row = dayRowsByHour[dayRowsByHour.length - i];
            if (row) {
                const hourStr = row.time ? (row.time.startsWith("0") ? row.time.slice(1, 5) : row.time.slice(0, 5)) : "";
                data["hour" + i] = hourStr;
                data["temp_hour" + i] = row.temperature || "";
                data["temp_is_required_hour" + i] = (row.temperatureIsRequired || (row === latestVitals.TRow && vitalsMap.T && !this.isValueInRange(row.temperature, vitalsMap.T.rangeMin, vitalsMap.T.rangeMax))) ? "required-cell" : "";
                data["temp_is_editable_hour" + i] = row.temperatureIsEditable === false ? unEditableCellHtml : "";

                data["pulse_hour" + i] = row.pulse || "";
                data["pulse_is_required_hour" + i] = (row.pulseIsRequired || (row === latestVitals.PRow && vitalsMap.P && !this.isValueInRange(row.pulse, vitalsMap.P.rangeMin, vitalsMap.P.rangeMax))) ? "required-cell" : "";
                data["pulse_is_editable_hour" + i] = row.pulseIsEditable === false ? unEditableCellHtml : "";

                data["respiration_hour" + i] = row.respiration || "";
                data["respiration_is_required_hour" + i] = (row.respirationIsRequired || (row === latestVitals.RRow && vitalsMap.R && !this.isValueInRange(row.respiration, vitalsMap.R.rangeMin, vitalsMap.R.rangeMax))) ? "required-cell" : "";
                data["respiration_is_editable_hour" + i] = row.respirationIsEditable === false ? unEditableCellHtml : "";

                data["food_and_water_hour" + i] = row.foodAndWater || "";
                data["food_and_water_is_required_hour" + i] = row.foodAndWaterIsRequired ? "required-cell" : "";
                data["food_and_water_is_editable_hour" + i] = row.foodAndWaterIsEditable === false ? unEditableCellHtml : "";

                data["comments_hour" + i] = row.rowComments || "";
                data["comments_is_required_hour" + i] = row.rowCommentsIsRequired ? "required-cell" : "";
                data["comments_is_editable_hour" + i] = row.rowCommentsIsEditable === false ? unEditableCellHtml : "";

                data["urine_hour" + i] = row.urineComments ? `${row.urineTypeId?.name || ""}, ${row.urineComments}` : (row.urineTypeId?.name || "");
                data["urine_is_required_hour" + i] = row.urineIsRequired ? "required-cell" : "";
                data["urine_is_editable_hour" + i] = row.urineIsEditable === false ? unEditableCellHtml : "";

                data["feces_hour" + i] = row.fecesComments ? `${row.fecesTypeId?.name || ""}, ${row.fecesComments}` : (row.fecesTypeId?.name || "");
                data["feces_is_required_hour" + i] = row.fecesIsRequired ? "required-cell" : "";
                data["feces_is_editable_hour" + i] = row.fecesIsEditable === false ? unEditableCellHtml : "";

                data["is_travel_hour" + i] = row.isTravel ? "checked" : "";
                data["is_travel_is_required_hour" + i] = row.isTravelIsRequired ? "required-cell" : "";
                data["is_travel_is_editable_hour" + i] = row.isTravelIsEditable === false ? unEditableCellHtml : "";

                data["is_box_clean_hour" + i] = row.isBoxClean ? "checked" : "";
                data["is_box_clean_is_required_hour" + i] = row.isBoxCleanIsRequired ? "required-cell" : "";
                data["is_box_clean_is_editable_hour" + i] = row.isBoxCleanIsEditable === false ? unEditableCellHtml : "";

                data["is_release_hour" + i] = row.isRelease ? "checked" : "";
                data["is_release_is_required_hour" + i] = row.isReleaseIsRequired ? "required-cell" : "";
                data["is_release_is_editable_hour" + i] = row.isReleaseIsEditable === false ? unEditableCellHtml : "";

                data["weigh_hour" + i] = row.weigh || "";
                data["weigh_is_required_hour" + i] = row.weighIsRequired ? "required-cell" : "";
                data["weigh_is_editable_hour" + i] = row.weighIsEditable === false ? unEditableCellHtml : "";

                data["is_puke_hour" + i] = row.isPuke ? "checked" : "";
                data["puke_comments_hour" + i] = row.pukeComments || "";
                data["puke_is_required_hour" + i] = row.pukeIsRequired ? "required-cell" : "";
                data["puke_is_editable_hour" + i] = row.pukeIsEditable === false ? unEditableCellHtml : "";

                data["owner_update_hour" + i] = row.ownerUpdate || "";
                data["owner_update_is_required_hour" + i] = row.ownerUpdateIsRequired ? "required-cell" : "";
                data["owner_update_is_editable_hour" + i] = row.ownerUpdateIsEditable === false ? unEditableCellHtml : "";
            } else {
                data["hour" + i] = "";
                data["temp_hour" + i] = "";
                data["temp_is_required_hour" + i] = "";
                data["temp_is_editable_hour" + i] = "";
                data["pulse_hour" + i] = "";
                data["pulse_is_required_hour" + i] = "";
                data["pulse_is_editable_hour" + i] = "";
                data["respiration_hour" + i] = "";
                data["respiration_is_required_hour" + i] = "";
                data["respiration_is_editable_hour" + i] = "";
                data["food_and_water_hour" + i] = "";
                data["food_and_water_is_required_hour" + i] = "";
                data["food_and_water_is_editable_hour" + i] = "";
                data["comments_hour" + i] = "";
                data["comments_is_required_hour" + i] = "";
                data["comments_is_editable_hour" + i] = "";
                data["urine_hour" + i] = "";
                data["urine_is_required_hour" + i] = "";
                data["urine_is_editable_hour" + i] = "";
                data["feces_hour" + i] = "";
                data["feces_is_required_hour" + i] = "";
                data["feces_is_editable_hour" + i] = "";
                data["is_travel_hour" + i] = "";
                data["is_travel_is_required_hour" + i] = "";
                data["is_travel_is_editable_hour" + i] = "";
                data["is_box_clean_hour" + i] = "";
                data["is_box_clean_is_required_hour" + i] = "";
                data["is_box_clean_is_editable_hour" + i] = "";
                data["is_release_hour" + i] = "";
                data["is_release_is_required_hour" + i] = "";
                data["is_release_is_editable_hour" + i] = "";
                data["weigh_hour" + i] = "";
                data["weigh_is_required_hour" + i] = "";
                data["weigh_is_editable_hour" + i] = "";
                data["is_puke_hour" + i] = "";
                data["puke_comments_hour" + i] = "";
                data["puke_is_required_hour" + i] = "";
                data["puke_is_editable_hour" + i] = "";
                data["owner_update_hour" + i] = "";
                data["owner_update_is_required_hour" + i] = "";
                data["owner_update_is_editable_hour" + i] = "";
            }
        }

        data.fluids = fluidsHtml.replace(/\{[a-zA-Z0-9_]+\}/g, "");
        data.medicines = medicinesHtml.replace(/\{[a-zA-Z0-9_]+\}/g, "");
        data.foodExtras = foodExtrasHtml.replace(/\{[a-zA-Z0-9_]+\}/g, "");
        data.procedures = proceduresHtml.replace(/\{[a-zA-Z0-9_]+\}/g, "");
        data.examinations = examinationsHtml.replace(/\{[a-zA-Z0-9_]+\}/g, "");

        let releaseMedsHtml = "";
        const releaseMedsTemplate = `<div><span>medicineName</span><span>:שם תרופה</span></div><div><span>doseAmount</span><span>:מינון</span></div>`;

        if (caseData.planned?.medicines) {
            caseData.planned.medicines.forEach(m => {
                const medicineName = (m.medicineId as PopulatedNameRef)?.name || "";
                const doseAmount = `${m.doseAmount || ""} ${(m.measureUnitTypeId as PopulatedNameRef)?.name || ""} ${(m.dosageFrequencyId as PopulatedNameRef)?.name || ""} ${(m.routeOfAdministrationId as PopulatedNameRef)?.name || ""}`;
                releaseMedsHtml += releaseMedsTemplate.replace(/medicineName/g, medicineName).replace(/doseAmount/g, doseAmount);
            });
        }
        data.releaseMedicines = releaseMedsHtml === "" ? " - " : releaseMedsHtml;

        return data;
    }

    private getLatestVitals(rows: PopulatedCaseDetailsRow[]) {
        let vitalsData: {
            TRow: PopulatedCaseDetailsRow | null;
            PRow: PopulatedCaseDetailsRow | null;
            RRow: PopulatedCaseDetailsRow | null;
        } = {
            TRow: null,
            PRow: null,
            RRow: null,
        };
        let tempFound = false, pulseFound = false, respirationFound = false;
        for (let i = rows.length - 1; i >= 0; i--) {
            const row = rows[i];
            if (row.temperature !== undefined && row.temperature !== null && !tempFound) {
                tempFound = true;
                vitalsData.TRow = row;
            }
            if (row.pulse !== undefined && row.pulse !== null && !pulseFound) {
                pulseFound = true;
                vitalsData.PRow = row;
            }
            if (row.respiration !== undefined && row.respiration !== null && !respirationFound) {
                respirationFound = true;
                vitalsData.RRow = row;
            }
        }
        return vitalsData;
    }

    private isValueInRange(value: number | undefined | null, min: number | undefined, max: number | undefined) {
        if (value === undefined || value === null || min === undefined || max === undefined) return true;
        return value >= min && value <= max;
    }

    private getAgeText(years?: number, months?: number): string {
        if (years === undefined && months === undefined) return "";
        if (years !== undefined && years !== null && months !== undefined && months !== null) return `${years} שנים ו ${months} חודשים`;
        if (years !== undefined && years !== null) return `${years} שנים`;
        if (months !== undefined && months !== null) return `${months} חודשים`;
        return "";
    }
}

export const exportService = new ExportService();
