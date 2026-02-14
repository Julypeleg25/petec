import { BaseRepository } from "./base.repository";
import { CaseModel } from "@models/Case";
import type { ICase, CaseDocument, ICaseDetailsRow } from "@models/Case";
import type { Types, UpdateQuery } from "mongoose";

export class CaseRepository extends BaseRepository<ICase> {
  constructor() {
    super(CaseModel);
  }

  async findByPatientId(patientId: string | Types.ObjectId): Promise<CaseDocument[]> {
    return this.model.find({ patientId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async findActiveByPatientId(patientId: string | Types.ObjectId): Promise<CaseDocument | null> {
    return this.model.findOne({
      patientId,
      isDeleted: false,
      isArchived: false,
      releaseDate: { $exists: false },
    }).exec();
  }

  async findByIdPopulated(id: string | Types.ObjectId): Promise<CaseDocument | null> {
    return this.model
      .findById(id)
      .populate("patientId")
      .populate("doctorUserId", "email role")
      .populate("nurseUserId", "email role")
      .populate("refs.animalTypeId", "name")
      .populate("refs.genderTypeId", "name")
      .populate("refs.raceTypeId", "name")
      .populate("refs.animalColorId", "name")
      .populate("refs.insuranceTypeId", "name")
      .populate("refs.foodTypeId", "name")
      .exec();
  }

  async updateCaseDetailsGrid(
    caseId: string | Types.ObjectId,
    grid: ICaseDetailsRow[],
  ): Promise<CaseDocument | null> {
    return this.updateById(caseId, { $set: { caseDetailsGrid: grid } });
  }

  async softDelete(caseId: string | Types.ObjectId): Promise<CaseDocument | null> {
    return this.updateById(caseId, { $set: { isDeleted: true } });
  }

  async archive(caseId: string | Types.ObjectId): Promise<CaseDocument | null> {
    return this.updateById(caseId, { $set: { isArchived: true } });
  }

  async release(
    caseId: string | Types.ObjectId,
    releasedByUserId: string | Types.ObjectId,
    updates: Partial<Pick<ICase, "dates">>,
  ): Promise<CaseDocument | null> {
    const update: UpdateQuery<ICase> = {
      $set: {
        releaseDate: new Date(),
        releasedByUserId,
        ...(updates.dates && { dates: updates.dates }),
      },
    };
    return this.updateById(caseId, update);
  }

  async findByMasterCaseId(masterCaseId: string | Types.ObjectId): Promise<CaseDocument[]> {
    return this.model.find({ masterCaseId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }
}

export const caseRepository = new CaseRepository();
