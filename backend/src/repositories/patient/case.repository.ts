import { toDateInputString } from "../../mappers/common/common.mappers.utils.js";
import { escapeRegex } from "../../mappers/table/table.mappers.utils.js";
import { BaseRepository } from "../base.repository.js";
import { CaseModel } from "../../models/case/index.js";
import type { ICase, CaseDocument, ICaseDetailsRow } from "../../models/case/index.js";
import type { Types, UpdateQuery, ClientSession } from "mongoose";

const buildSerialPrefixRegex = (serialPrefix: string): RegExp =>
  new RegExp(`^${escapeRegex(serialPrefix)}(?:-[\\d-]+)?$`);
const JERUSALEM_TIME_ZONE = "Asia/Jerusalem";

export class CaseRepository extends BaseRepository<ICase> {
  constructor() {
    super(CaseModel);
  }

  async findByPatientId(
    patientId: string | Types.ObjectId,
    options?: QueryOptions<ICase>,
  ): Promise<CaseDocument[]> {
    return this.model.find({ patientId, isDeleted: false }, null, options).sort({ createdAt: -1 }).exec();
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
      .populate("doctorUserId", "email role firstName lastName")
      .populate("nurseUserId", "email role firstName lastName")
      .populate("refs.animalTypeId", "_id name")
      .populate("refs.genderTypeId", "_id name")
      .populate("refs.raceTypeId", "_id name")
      .populate("refs.animalColorId", "_id name")
      .populate("refs.insuranceTypeId", "_id name")
      .populate("refs.foodTypeId", "_id name")
      .populate("caseDetailsGrid.fluids.medicineId", "_id name")
      .populate("caseDetailsGrid.fluids.measureUnitTypeId", "_id name")
      .populate("caseDetailsGrid.fluids.dosageFrequencyId", "_id name")
      .populate("caseDetailsGrid.fluids.routeOfAdministrationId", "_id name")
      .populate("caseDetailsGrid.medicines.medicineId", "_id name")
      .populate("caseDetailsGrid.medicines.measureUnitTypeId", "_id name")
      .populate("caseDetailsGrid.medicines.dosageFrequencyId", "_id name")
      .populate("caseDetailsGrid.medicines.routeOfAdministrationId", "_id name")
      .populate("caseDetailsGrid.procedures.typeId", "_id name")
      .populate("caseDetailsGrid.examinations.typeId", "_id name")
      .populate("caseDetailsGrid.foodExtras.typeId", "_id name")
      .populate("caseDetailsGrid.urineTypeId", "_id name")
      .populate("caseDetailsGrid.fecesTypeId", "_id name")
      .exec();
  }

  async findBySerialId(serialId: string, options?: QueryOptions<ICase>): Promise<CaseDocument | null> {
    return this.model.findOne({ serialId }, null, options).exec();
  }

  async findBySerialIdPopulated(serialId: string): Promise<CaseDocument | null> {
    return this.model
      .findOne({ serialId })
      .populate("patientId")
      .populate("doctorUserId", "email role firstName lastName")
      .populate("nurseUserId", "email role firstName lastName")
      .populate("refs.animalTypeId", "_id name")
      .populate("refs.genderTypeId", "_id name")
      .populate("refs.raceTypeId", "_id name")
      .populate("refs.animalColorId", "_id name")
      .populate("refs.insuranceTypeId", "_id name")
      .populate("refs.foodTypeId", "_id name")
      .populate("caseDetailsGrid.fluids.medicineId", "_id name")
      .populate("caseDetailsGrid.fluids.measureUnitTypeId", "_id name")
      .populate("caseDetailsGrid.fluids.dosageFrequencyId", "_id name")
      .populate("caseDetailsGrid.fluids.routeOfAdministrationId", "_id name")
      .populate("caseDetailsGrid.medicines.medicineId", "_id name")
      .populate("caseDetailsGrid.medicines.measureUnitTypeId", "_id name")
      .populate("caseDetailsGrid.medicines.dosageFrequencyId", "_id name")
      .populate("caseDetailsGrid.medicines.routeOfAdministrationId", "_id name")
      .populate("caseDetailsGrid.procedures.typeId", "_id name")
      .populate("caseDetailsGrid.examinations.typeId", "_id name")
      .populate("caseDetailsGrid.foodExtras.typeId", "_id name")
      .populate("caseDetailsGrid.urineTypeId", "_id name")
      .populate("caseDetailsGrid.fecesTypeId", "_id name")
      .exec();
  }

  async findLatestBySerialPrefix(
    serialPrefix: string,
  ): Promise<CaseDocument | null> {
    return this.model
      .findOne({ serialId: buildSerialPrefixRegex(serialPrefix) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findBySerialPrefix(
    serialPrefix: string,
    options?: QueryOptions<ICase>,
  ): Promise<CaseDocument[]> {
    return this.model
      .find({ serialId: buildSerialPrefixRegex(serialPrefix), isDeleted: false }, null, options)
      .sort({ createdAt: -1 })
      .exec();
  }

  async assignMasterCaseBySerialPrefix(
    serialPrefix: string,
    masterCaseId: string | Types.ObjectId,
    options?: QueryOptions<ICase>,
  ): Promise<void> {
    await this.model
      .updateMany(
        { serialId: buildSerialPrefixRegex(serialPrefix) },
        { $set: { masterCaseId } },
        options,
      )
      .exec();
  }

  async updateCaseDetailsGrid(
    caseId: string | Types.ObjectId,
    grid: ICaseDetailsRow[],
  ): Promise<CaseDocument | null> {
    return this.updateById(caseId, { $set: { caseDetailsGrid: grid } });
  }

  async updateCaseDetailsGridBySerialId(
    serialId: string,
    grid: ICaseDetailsRow[],
    session?: ClientSession,
  ): Promise<CaseDocument | null> {
    return this.updateOne({ serialId }, { $set: { caseDetailsGrid: grid } }, { session });
  }

  async softDelete(
    caseId: string | Types.ObjectId,
    options?: QueryOptions<ICase>,
  ): Promise<CaseDocument | null> {
    return this.updateById(caseId, { $set: { isDeleted: true } }, options);
  }

  async archive(
    caseId: string | Types.ObjectId,
    isArchived = true,
    options?: QueryOptions<ICase>,
  ): Promise<CaseDocument | null> {
    return this.updateById(caseId, { $set: { isArchived } }, options);
  }

  async unarchiveProceduresScheduledForDate(targetDate: Date): Promise<number> {
    const targetDateKey = toDateInputString(targetDate);
    if (!targetDateKey) {
      return 0;
    }

    const result = await this.model
      .updateMany(
        {
          isArchived: true,
          isDeleted: false,
          "flags.isProcedure": true,
          "dates.procedureDate": { $type: "date" },
          $expr: {
            $eq: [
              {
                $dateToString: {
                  date: "$dates.procedureDate",
                  format: "%Y-%m-%d",
                  timezone: JERUSALEM_TIME_ZONE,
                },
              },
              targetDateKey,
            ],
          },
        },
        { $set: { isArchived: false, isManuallyUnarchived: false } },
      )
      .exec();

    return result.modifiedCount ?? 0;
  }

  async release(
    caseId: string | Types.ObjectId,
    releasedByUserId: string | Types.ObjectId,
    updates: Partial<Pick<ICase, "dates">>,
    session?: ClientSession,
  ): Promise<CaseDocument | null> {
    const update: UpdateQuery<ICase> = {
      $set: {
        releaseDate: new Date(),
        releasedByUserId,
        ...(updates.dates && { dates: updates.dates }),
      },
    };
    return this.updateById(caseId, update, { session });
  }

  async findByMasterCaseId(masterCaseId: string | Types.ObjectId): Promise<CaseDocument[]> {
    return this.model.find({ masterCaseId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }
}

export const caseRepository = new CaseRepository();
