import type { IAnimalVitals } from "../../models/lookups/index.js";
import { systemTypesRepository } from "../../repositories/admin/index.js";
import { SYSTEM_TYPE_NAMES } from "@petec/shared";
import { buildAnimalVitalsMap } from "../../utils/animalVitals.utils.js";
import {
  buildCaseAlertSummary,
  getCaseAnimalTypeId,
  type CaseAlertEvaluable,
  type CaseAlertSummary,
} from "./utils/caseAlertsService.utils.js";

export class CaseAlertsService {
  async attachAlertCounts<TCase extends CaseAlertEvaluable>(
    cases: ReadonlyArray<TCase>,
  ): Promise<Array<TCase & { numOfAlerts: number }>> {
    if (cases.length === 0) {
      return [];
    }

    const vitalsMapByAnimalTypeId = await this.getVitalsMapByAnimalTypeId(cases);

    return cases.map((caseDoc) => {
      const animalTypeId = getCaseAnimalTypeId(caseDoc);
      const vitalsMap =
        animalTypeId.length > 0
          ? (vitalsMapByAnimalTypeId.get(animalTypeId) ?? {})
          : {};
      const alertSummary = buildCaseAlertSummary(caseDoc, vitalsMap);

      return {
        ...caseDoc,
        numOfAlerts: alertSummary.total,
      };
    });
  }

  async getCaseAlertSummary(
    caseDoc: CaseAlertEvaluable,
  ): Promise<CaseAlertSummary> {
    const vitalsMapByAnimalTypeId = await this.getVitalsMapByAnimalTypeId([
      caseDoc,
    ]);
    const animalTypeId = getCaseAnimalTypeId(caseDoc);

    return buildCaseAlertSummary(
      caseDoc,
      animalTypeId.length > 0
        ? (vitalsMapByAnimalTypeId.get(animalTypeId) ?? {})
        : {},
    );
  }

  private async getVitalsMapByAnimalTypeId<TCase extends CaseAlertEvaluable>(
    cases: ReadonlyArray<TCase>,
  ): Promise<Map<string, Record<string, IAnimalVitals>>> {
    const animalTypeIds = Array.from(
      new Set(
        cases
          .map((caseDoc) => getCaseAnimalTypeId(caseDoc))
          .filter((animalTypeId) => animalTypeId.length > 0),
      ),
    );

    if (animalTypeIds.length === 0) {
      return new Map<string, Record<string, IAnimalVitals>>();
    }

    const entries = await Promise.all(
      animalTypeIds.map(async (animalTypeId) => {
        const animalVitalsDocs = await systemTypesRepository.findByAnimalTypeId(
          SYSTEM_TYPE_NAMES.ANIMAL_VITALS,
          animalTypeId,
        );
        const animalVitals = animalVitalsDocs.map(
          (doc) => doc.toObject() as IAnimalVitals,
        );

        return [animalTypeId, buildAnimalVitalsMap(animalVitals)] as const;
      }),
    );

    return new Map(entries);
  }
}

export const caseAlertsService = new CaseAlertsService();
