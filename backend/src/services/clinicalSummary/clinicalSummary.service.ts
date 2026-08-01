import { NotFoundError } from "@petec/shared";
import { ENV } from "../../config/config.js";
import { logger } from "../../config/logger.js";
import { CaseModel, PatientModel } from "../../models/index.js";
import {
  buildClinicalCaseDetailItems,
  buildClinicalSummaryInput,
  getClinicalSummaryDates,
  hasClinicalSummaryContent,
} from "./clinicalSummary.input.js";
import { ClinicalSummaryUnavailableError } from "./clinicalSummary.error.js";
import {
  generateGroqClinicalSummary,
  ClinicalSummaryProviderError,
} from "./clinicalSummary.provider.js";
import { withClinicalSummaryLimit } from "./clinicalSummary.rateLimit.js";
import type { ClinicalSummaryFailureCategory } from "./clinicalSummary.types.js";

const CASE_ALLOWLIST = [
  "createdAt",
  "updatedAt",
  "admission.hospitalizationReason",
  "admission.allergicComments",
  "patientSnapshot.ageYears",
  "patientSnapshot.ageMonths",
  "patientSnapshot.weightKg",
  "flags.isAllergic",
  "flags.isEscapePotential",
  "flags.isNPO",
  "flags.isRiskAnesthesia",
  "flags.isHeartMurmur",
  "flags.isAggressive",
  "flags.isAMB",
  "flags.isConvenia",
  "flags.isCerenia",
  "dates.nextInspectionDate",
  "dates.stitchesRemovalDate",
  "refs.animalTypeId",
  "refs.genderTypeId",
  "refs.raceTypeId",
  "comments",
  "dailyPlan.comments",
  "caseDetailsGrid.date",
  "caseDetailsGrid.time",
  "caseDetailsGrid.dateTime",
  "caseDetailsGrid.temperature",
  "caseDetailsGrid.temperatureIsRequired",
  "caseDetailsGrid.pulse",
  "caseDetailsGrid.pulseIsRequired",
  "caseDetailsGrid.respiration",
  "caseDetailsGrid.respirationIsRequired",
  "caseDetailsGrid.urineComments",
  "caseDetailsGrid.urineIsRequired",
  "caseDetailsGrid.fecesComments",
  "caseDetailsGrid.fecesIsRequired",
  "caseDetailsGrid.pukeComments",
  "caseDetailsGrid.pukeIsRequired",
  "caseDetailsGrid.rowComments",
  "caseDetailsGrid.rowCommentsIsRequired",
  "caseDetailsGrid.foodAndWater",
  "caseDetailsGrid.foodAndWaterIsRequired",
  "caseDetailsGrid.foodGiven",
  "caseDetailsGrid.waterGiven",
  "caseDetailsGrid.isBoxClean",
  "caseDetailsGrid.isBoxCleanIsRequired",
  "caseDetailsGrid.isRelease",
  "caseDetailsGrid.isReleaseIsRequired",
  "caseDetailsGrid.isTravel",
  "caseDetailsGrid.isTravelIsRequired",
  "caseDetailsGrid.isPuke",
  "caseDetailsGrid.weigh",
  "caseDetailsGrid.weighIsRequired",
  "caseDetailsGrid.ownerUpdate",
  "caseDetailsGrid.ownerUpdateIsRequired",
  "caseDetailsGrid.urineTypeId",
  "caseDetailsGrid.fecesTypeId",
  "caseDetailsGrid.medicines.medicineId",
  "caseDetailsGrid.medicines.dosageText",
  "caseDetailsGrid.medicines.doseAmount",
  "caseDetailsGrid.medicines.measureUnitTypeId",
  "caseDetailsGrid.medicines.dosageFrequencyId",
  "caseDetailsGrid.medicines.routeOfAdministrationId",
  "caseDetailsGrid.medicines.isGiven",
  "caseDetailsGrid.fluids.medicineId",
  "caseDetailsGrid.fluids.dosageText",
  "caseDetailsGrid.medicines.isRequired",
  "caseDetailsGrid.fluids.isRequired",
  "caseDetailsGrid.fluids.doseAmount",
  "caseDetailsGrid.fluids.dosageFrequencyId",
  "caseDetailsGrid.fluids.measureUnitTypeId",
  "caseDetailsGrid.fluids.routeOfAdministrationId",
  "caseDetailsGrid.fluids.isGiven",
  "caseDetailsGrid.medicines.comment",
  "caseDetailsGrid.fluids.comment",
  "caseDetailsGrid.procedures.typeId",
  "caseDetailsGrid.procedures.isGiven",
  "caseDetailsGrid.procedures.isRequired",
  "caseDetailsGrid.procedures.comment",
  "caseDetailsGrid.foodExtras.typeId",
  "caseDetailsGrid.foodExtras.isGiven",
  "caseDetailsGrid.foodExtras.isRequired",
  "caseDetailsGrid.foodExtras.comment",
  "caseDetailsGrid.examinations.typeId",
  "caseDetailsGrid.examinations.value",
  "caseDetailsGrid.examinations.isRequired",
  "caseDetailsGrid.examinations.comment",
].join(" ");

const logAudit = (data: {
  userId: string;
  patientId: string;
  success: boolean;
  category?: ClinicalSummaryFailureCategory;
  durationMs: number;
  truncated?: boolean;
}): void => {
  logger.info("Clinical summary audit", {
    module: "clinical_summary",
    event: "clinical_summary_requested",
    user_id: data.userId,
    patient_id: data.patientId,
    model: ENV.groqModel,
    success: data.success,
    failure_category: data.category,
    duration_ms: data.durationMs,
    input_was_truncated: data.truncated ?? false,
  });
};

class ClinicalSummaryService {
  async generate(patientId: string, userId: string, requestedDate?: string) {
    return withClinicalSummaryLimit(userId, patientId, async () => {
      const startedAt = Date.now();
      let truncated = false;
      try {
        if (!ENV.aiSummaryEnabled)
          throw Object.assign(new ClinicalSummaryUnavailableError(), {
            category: "disabled",
          });
        if (!ENV.groqApiKey)
          throw Object.assign(new ClinicalSummaryUnavailableError(), {
            category: "missing_key",
          });
        const patientExists = await PatientModel.exists({ _id: patientId });
        if (!patientExists) throw new NotFoundError("Patient not found");
        const caseRecord = await CaseModel.findOne({
          patientId,
          isDeleted: false,
        })
          .sort({ updatedAt: -1 })
          .select(CASE_ALLOWLIST)
          .populate("refs.animalTypeId", "name")
          .populate("refs.genderTypeId", "name")
          .populate("refs.raceTypeId", "name")
          .populate("caseDetailsGrid.medicines.medicineId", "name")
          .populate("caseDetailsGrid.medicines.measureUnitTypeId", "name")
          .populate("caseDetailsGrid.medicines.dosageFrequencyId", "name")
          .populate("caseDetailsGrid.medicines.routeOfAdministrationId", "name")
          .populate("caseDetailsGrid.fluids.medicineId", "name")
          .populate("caseDetailsGrid.fluids.measureUnitTypeId", "name")
          .populate("caseDetailsGrid.fluids.dosageFrequencyId", "name")
          .populate("caseDetailsGrid.fluids.routeOfAdministrationId", "name")
          .populate("caseDetailsGrid.procedures.typeId", "name")
          .populate("caseDetailsGrid.foodExtras.typeId", "name")
          .populate("caseDetailsGrid.examinations.typeId", "name")
          .populate("caseDetailsGrid.urineTypeId", "name")
          .populate("caseDetailsGrid.fecesTypeId", "name")
          .lean()
          .exec();
        if (!caseRecord) throw new ClinicalSummaryUnavailableError();
        const availableDates = getClinicalSummaryDates(caseRecord);
        const summaryDate = requestedDate ?? availableDates[0];
        if (!summaryDate || !availableDates.includes(summaryDate)) {
          throw Object.assign(new ClinicalSummaryUnavailableError(), {
            category: "empty_record",
          });
        }
        let input;
        try {
          input = buildClinicalSummaryInput(caseRecord);
        } catch {
          throw Object.assign(new ClinicalSummaryUnavailableError(), {
            category: "input_too_large",
          });
        }
        truncated = input.sourceMetadata.inputWasTruncated;
        const caseDetailItems = buildClinicalCaseDetailItems(
          caseRecord,
          summaryDate,
        );
        if (!hasClinicalSummaryContent(input))
          throw Object.assign(new ClinicalSummaryUnavailableError(), {
            category: "empty_record",
          });
        const result = await generateGroqClinicalSummary(input);
        logAudit({
          userId,
          patientId,
          success: true,
          durationMs: Date.now() - startedAt,
          truncated,
        });
        return {
          ...result,
          summaryDate,
          availableDates,
          medicationAdministrations: input.treatments,
          caseDetailItems,
        };
      } catch (error) {
        const category =
          error instanceof ClinicalSummaryProviderError
            ? error.category
            : ((error as { category?: ClinicalSummaryFailureCategory })
                .category ?? "provider");
        logAudit({
          userId,
          patientId,
          success: false,
          category,
          durationMs: Date.now() - startedAt,
          truncated,
        });
        if (error instanceof NotFoundError) throw error;
        if (error instanceof ClinicalSummaryUnavailableError) throw error;
        throw new ClinicalSummaryUnavailableError(
          error instanceof ClinicalSummaryProviderError &&
            error.category === "rate_limit"
            ? 429
            : 503,
        );
      }
    });
  }
}

export const clinicalSummaryService = new ClinicalSummaryService();
