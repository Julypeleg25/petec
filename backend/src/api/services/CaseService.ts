import { AppDataSource } from "../../config/typeORM";
import { DeepPartial, Repository } from "typeorm";
import { Patient } from "../models/Patient";
import { NewPatientDTO } from "../controllers/PatientController";
import { TokenUser } from "../middlewares/AuthMiddleware";
import { Case } from "../models/Case";
import { MasterCase } from "../models/MasterCase";
import { MasterCaseCases } from "../models/MasterCaseCases";
import { isDatesEqual } from "../utils/DateUtils";

class CaseService {
  private CaseRepository: Repository<Case> = AppDataSource.getRepository(Case);
  private MasterCaseRepository: Repository<MasterCase> =
    AppDataSource.getRepository(MasterCase);
  private MasterCaseCasesRepository: Repository<MasterCaseCases> =
    AppDataSource.getRepository(MasterCaseCases);

  constructor() {}

  async createCase(
    {
      caseId,
      ageYears,
      ageMonths,
      weightKg,
      doctorId,
      nurseId,
      referringDoctor,
      hospitalizationReason,
      allergicComments,
      isAllergic,
      isEscapePotential,
      isNPO,
      isRiskAnesthesia,
      isHeartMurmur,
      isAMB,
      isAggressive,
      isCerenia,
      isConvenia,
      catheterDate,
      procedureDate,
      isProcedure,
      bloodTestLink,
    }: NewPatientDTO,
    { userId }: TokenUser,
    patientId: number
  ): Promise<DeepPartial<Case>> {
    // Create the Master Case if not exists
    const masterCase = await this.MasterCaseCasesRepository.findOneBy({
      masterCaseId: caseId,
    });

    if (!masterCase) {
      await this.MasterCaseRepository.save({
        id: caseId,
        createdAt: new Date(),
      } as MasterCase);
    }

    const childCaseId = caseId + "-" + new Date().getTime();
    const newCase = await this.CaseRepository.save({
      id: childCaseId,
      createdBy: userId,
      updatedBy: userId,
      ageYears,
      ageMonths,
      weightKg,
      doctorId,
      nurseId,
      referringDoctor,
      hospitalizationReason,
      bloodTestLink,
      allergicComments,
      isAllergic,
      isEscapePotential,
      isNPO,
      isRiskAnesthesia,
      isHeartMurmur,
      isAMB,
      isAggressive,
      isCerenia,
      isConvenia,
      catheterDate,
      procedureDate,
      isProcedure,
      isArchived:
        procedureDate !== null &&
        procedureDate !== "" &&
        !isDatesEqual(new Date(procedureDate), new Date()),
      patientId: { id: patientId } as Patient,
    } as DeepPartial<Case>);

    // Create the child Case
    await this.MasterCaseCasesRepository.save({
      caseId: childCaseId,
      masterCaseId: caseId,
    });

    return newCase;
  }

  async getCaseByPatientId(patientId: number): Promise<Case | null> {
    return await this.CaseRepository.findOneBy({
      patientId: { id: patientId } as Patient,
      isDeleted: false,
    });
  }

  async getMasterCaseByCaseId(caseId: string): Promise<MasterCase | null> {
    const masterCaseCases = await this.MasterCaseCasesRepository.findOneBy({
      case: { id: caseId } as Case,
    });

    if (!masterCaseCases) return null;
    return await this.MasterCaseRepository.findOneBy({
      id: masterCaseCases.masterCaseId,
    });
  }

  async saveCase(patientCase: Case): Promise<Case> {
    return await this.CaseRepository.save(patientCase);
  }

  async deleteCaseById(caseId: string): Promise<void> {
    await this.CaseRepository.delete({
      id: caseId,
    });
  }

  async getCaseById(caseId: string): Promise<Case | null> {
    return await this.CaseRepository.findOneBy({
      id: caseId,
      isDeleted: false,
    });
  }

  async deleteMasterCase(masterCaseId: string, caseId: string) {
    const masterCaseCases = await this.MasterCaseCasesRepository.findBy({
      masterCase: { id: masterCaseId } as MasterCase,
    });

    await this.MasterCaseCasesRepository.delete({
      case: { id: caseId } as Case,
      masterCase: { id: masterCaseId } as MasterCase,
    });

    if (masterCaseCases.length === 1) {
      await this.MasterCaseRepository.delete({
        id: masterCaseId,
      });
    }
  }
}

export default CaseService;
