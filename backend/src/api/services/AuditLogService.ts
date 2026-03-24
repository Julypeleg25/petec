import { Repository } from "typeorm";
import { User } from "../models/User";
import { AppDataSource } from "../../config/typeORM";
import { AuditLog } from "../models/AuditLog";
import { Patient } from "../models/Patient";
import { Case } from "../models/Case";

export interface LogDTO {
  subject: string;
  description: string;
  patientId?: number;
  caseId?: string;
  userId?: number;
}

class AuditLogService {
  private auditLogRepository: Repository<AuditLog>;

  constructor() {
    this.auditLogRepository = AppDataSource.getRepository(AuditLog);
  }

  async audit({
    subject,
    description,
    patientId,
    caseId,
    userId,
  }: LogDTO): Promise<void> {
    const log = new AuditLog();
    log.subject = subject;
    log.description = description;
    log.patientId = patientId ? ({ id: patientId } as Patient) : undefined;
    log.caseId = caseId ? ({ id: caseId } as Case) : undefined;
    log.createdAt = new Date();
    log.createdBy = userId ? ({ id: userId } as User) : undefined;

    // await this.auditLogRepository.save(log);
  }

  async deleteAllByCaseId(caseId: string): Promise<void> {
    await this.auditLogRepository.delete({ caseId: { id: caseId } });
  }
}

export default AuditLogService;
