import { logger } from "@config/logger";
import { caseRepository } from "@repositories/case.repository";
import type { CaseDocument, ICaseDetailsRow } from "@models/Case";
import {
    checkCaseDetailRowForAlerts,
    getCasePatientName,
    getRecentCaseDetailRows,
    NOTIFICATIONS_CONSTANTS,
    toAlertCutoffDate,
    type VitalAlert,
} from "@services/utils/notifications.service.utils";

const MODULE = NOTIFICATIONS_CONSTANTS.MODULE;

export class NotificationsService {
    async computeAlertCounts(): Promise<Map<string, number>> {
        const cutoff = toAlertCutoffDate();

        const activeCases = await caseRepository.findMany(
            {
                isDeleted: false,
                isArchived: false,
                "caseDetailsGrid.dateTime": { $gte: cutoff },
            },
            {
                sort: { createdAt: -1 },
                populate: "patientId",
            },
        );

        const alertCountMap = new Map<string, number>();

        for (const caseDoc of activeCases) {
            const caseObj = caseDoc.toObject() as CaseDocument & { patientId?: { name?: string } };
            const patientName = getCasePatientName(caseObj);
            const recentRows = getRecentCaseDetailRows(
                caseObj.caseDetailsGrid ?? [],
                cutoff,
            );

            let alertCount = 0;
            for (const row of recentRows) {
                alertCount += checkCaseDetailRowForAlerts(
                    row,
                    caseObj.serialId,
                    patientName,
                ).length;
            }
            alertCountMap.set(caseObj.serialId, alertCount);
        }

        logger.info("Notification alerts computed", {
            module: MODULE,
            case_count: alertCountMap.size,
            total_alerts: Array.from(alertCountMap.values()).reduce((sum, v) => sum + v, 0),
        });

        return alertCountMap;
    }

    async getCaseAlerts(caseSerialId: string): Promise<VitalAlert[]> {
        const cutoff = toAlertCutoffDate();
        const caseDoc = await caseRepository.findBySerialIdPopulated(caseSerialId);
        if (!caseDoc) return [];

        const caseObj = caseDoc.toObject() as CaseDocument & { patientId?: { name?: string } };
        const patientName = getCasePatientName(caseObj);
        const recentRows = getRecentCaseDetailRows(
            caseObj.caseDetailsGrid ?? [],
            cutoff,
        );

        const allAlerts: VitalAlert[] = [];
        for (const row of recentRows) {
            allAlerts.push(
                ...checkCaseDetailRowForAlerts(row, caseSerialId, patientName),
            );
        }

        logger.info("Case alerts retrieved", {
            module: MODULE,
            case_serial_id: caseSerialId,
            alert_count: allAlerts.length,
        });

        return allAlerts;
    }
}

export const notificationsService = new NotificationsService();
