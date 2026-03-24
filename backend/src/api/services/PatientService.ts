import { AppDataSource, getQueryRunner } from "../../config/typeORM";
import { Repository } from "typeorm";
import { Patient } from "../models/Patient";
import {
  AnesthesiaProcedureFormData,
  CaseDetailsData,
  CaseDetailsMedicineObj,
  CaseDetailsOptionsObj,
  EditPatientDTO,
  NewPatientDTO,
  PatientReturnDTO,
  ReleasePatientDTO,
} from "../controllers/PatientController";
import { TokenUser } from "../middlewares/AuthMiddleware";
import CaseService from "./CaseService";
import { User } from "../models/User";
import { AnimalType } from "../models/AnimalType";
import { GenderType } from "../models/GenderType";
import { RaceType } from "../models/RaceType";
import { AnimalColor } from "../models/AnimalColor";
import { CaseDailyDetails } from "../models/CaseDailyDetails";
import { UrineType } from "../models/UrineType";
import { FecesType } from "../models/FecesType";
import { Case } from "../models/Case";
import { CaseDailyDetailsMedicines } from "../models/CaseDailyDetailsMedicines";
import { Medicine } from "../models/Medicine";
import { DosageFrequency } from "../models/DosageFrequency";
import { RouteOfAdministration } from "../models/RouteOfAdministration";
import { sqlQueries } from "../../config/SqlQueries";
import { FoodType } from "../models/FoodType";
import { PatientMedicine } from "../models/PatientMedicine";
import { createPdf, deleteImage, uploadImage } from "../utils/FileUtils";
import { CaseMedicines } from "../models/CaseMedicines";
import { PatientDocument } from "../models/PatientDocument";
import { PatientDocumentType } from "../models/PatientDocumentType";
import logger from "../../api/utils/Logger";
import { AnesthesiaProcedureForm } from "../models/AnesthesiaProcedureForm";
import { InsuranceType } from "../models/InsuranceType";
import { CaseFoodExtras } from "../models/CaseFoodExtras";
import { CaseExaminations } from "../models/CaseExaminations";
import { CaseDailyDetailsFoodExtras } from "../models/CaseDailyDetailsFoodExtras";
import { CaseDailyDetailsExaminations } from "../models/CaseDailyDetailsExaminations";
import { ExaminationType } from "../models/ExaminationType";
import { FoodExtraType } from "../models/FoodExtraType";
import { CaseProcedures } from "../models/CaseProcedures";
import { CaseDailyDetailsProcedures } from "../models/CaseDailyDetailsProcedures";
import { ProcedureType } from "../models/ProcedureType";
import AdminService from "./AdminService";
import AuditLogService from "./AuditLogService";

const DAILY_CASE_TABLE_COL_NUM = 14;

class PatientService {
  private CaseService: CaseService = new CaseService();
  private auditLogServiceService: AuditLogService = new AuditLogService();
  private PatientRepository: Repository<Patient> =
    AppDataSource.getRepository(Patient);
  private caseDailyDetailsRepository: Repository<CaseDailyDetails> =
    AppDataSource.getRepository(CaseDailyDetails);
  private caseDailyDetailsMedicinesRepository: Repository<CaseDailyDetailsMedicines> =
    AppDataSource.getRepository(CaseDailyDetailsMedicines);
  private patientMedicineRepository: Repository<PatientMedicine> =
    AppDataSource.getRepository(PatientMedicine);
  private caseMedicinesRepository: Repository<CaseMedicines> =
    AppDataSource.getRepository(CaseMedicines);
  private patientDocumentRepository: Repository<PatientDocument> =
    AppDataSource.getRepository(PatientDocument);
  private patientDocumentTypeRepository: Repository<PatientDocumentType> =
    AppDataSource.getRepository(PatientDocumentType);
  private anesthesiaProcedureFormRepository: Repository<AnesthesiaProcedureForm> =
    AppDataSource.getRepository(AnesthesiaProcedureForm);
  private caseFoodExtrasRepository: Repository<CaseFoodExtras> =
    AppDataSource.getRepository(CaseFoodExtras);
  private caseDailyDetailsFoodExtrasRepository: Repository<CaseDailyDetailsFoodExtras> =
    AppDataSource.getRepository(CaseDailyDetailsFoodExtras);
  private caseProceduresRepository: Repository<CaseProcedures> =
    AppDataSource.getRepository(CaseProcedures);
  private caseDailyDetailsProceduresRepository: Repository<CaseDailyDetailsProcedures> =
    AppDataSource.getRepository(CaseDailyDetailsProcedures);
  private caseExaminationsRepository: Repository<CaseExaminations> =
    AppDataSource.getRepository(CaseExaminations);
  private caseDailyDetailsExaminationsRepository: Repository<CaseDailyDetailsExaminations> =
    AppDataSource.getRepository(CaseDailyDetailsExaminations);

  constructor() { }

  convertPatientEntityToPatientReturnDTO({
    name,
    ownerName,
    ownerPhoneNumber,
    animalId: { id },
    raceId,
    genderId,
  }: Patient): PatientReturnDTO {
    return {
      name,
      ownerName,
      ownerPhoneNumber,
      animalId: id,
      raceId: raceId?.id!,
      genderId: genderId.id!,
    };
  }

  async create(
    { animalId, ...patient }: NewPatientDTO,
    file: Express.Multer.File,
    { userId }: TokenUser
  ): Promise<Patient> {
    // Uploading the image
    let imageUrl = undefined;
    if (file) imageUrl = await uploadImage(file);

    // Create the patient
    const newPatient = await this.PatientRepository.save({
      name: patient.name,
      ownerName: patient.ownerName,
      ownerPhoneNumber: patient.ownerPhoneNumber,
      animalId: { id: animalId } as AnimalType,
      genderId: { id: patient.genderId } as GenderType,
      raceId: patient.raceId ? ({ id: patient.raceId } as RaceType) : undefined,
      animalColorId: { id: patient.animalColorId } as AnimalColor,
      insuranceId: { id: patient.insuranceId } as InsuranceType,
      foodTypeId: { id: patient.foodTypeId } as FoodType,
      createdAt: new Date(),
      createdBy: { id: parseInt(userId) } as User,
      photoName: imageUrl,
    });

    // Create the matching case
    const newCase = await this.CaseService.createCase(
      { animalId, ...patient },
      {
        userId,
      } as TokenUser,
      newPatient.id
    );

    await this.auditLogServiceService.audit({
      subject: "מטופל חדש",
      description: "מטופל חדש נוסף למערכת",
      patientId: newPatient.id,
      caseId: newCase ? newCase.id : undefined,
      userId: parseInt(userId),
    });

    return newPatient;
  }

  async edit(
    { id, ...patient }: EditPatientDTO,
    file: Express.Multer.File,
    { userId }: TokenUser
  ): Promise<Patient> {
    const patientToEdit = await this.PatientRepository.findOneBy({ id });
    if (!patientToEdit) throw new Error("המטופל לא נמצא");

    const patientCase = await this.CaseService.getCaseByPatientId(id);
    if (patientCase == null) throw new Error("תיק המטופל לא נמצא");

    const caseDetailsDataArr = patient.caseDetails;
    // await this.validateCaseDetailsList(patientCase.id, caseDetailsDataArr);

    // Update case
    patientCase.ageYears = patient.ageYears;
    patientCase.ageMonths = patient.ageMonths;
    patientCase.weightKg = patient.weightKg;
    patientCase.doctorId = { id: patient.doctorId } as User;
    patientCase.nurseId = { id: patient.nurseId } as User;
    patientCase.referringDoctor = patient.referringDoctor;
    patientCase.comments = patient.comments ? patient.comments : null;
    patientCase.hospitalizationReason = patient.hospitalizationReason;
    patientCase.bloodTestLink = patient.bloodTestLink;
    patientCase.isAllergic = patient.isAllergic;
    patientCase.allergicComments = patient.allergicComments;
    patientCase.isEscapePotential = patient.isEscapePotential;
    patientCase.isNPO = patient.isNPO;
    patientCase.isRiskAnesthesia = patient.isRiskAnesthesia;
    patientCase.isHeartMurmur = patient.isHeartMurmur;
    patientCase.isAMB = patient.isAMB;
    patientCase.isAggressive = patient.isAggressive;
    patientCase.isCerenia = patient.isCerenia;
    patientCase.isConvenia = patient.isConvenia;
    patientCase.catheterDate = patient.catheterDate
      ? new Date(patient.catheterDate)
      : null;
    patientCase.procedureDate = patient.procedureDate
      ? new Date(patient.procedureDate)
      : null;
    patientCase.isProcedure = patient.isProcedure;
    patientCase.updatedBy = { id: parseInt(userId) } as User;
    patientCase.updatedAt = new Date();

    // Update patient
    let imageUrl = undefined;
    if (file) {
      // Delete the old image
      try {
        if (patientToEdit.photoName) deleteImage(patientToEdit.photoName);
      } catch (err) {
        logger.error(`Error deleting the file: ${err}`);
      }
      imageUrl = await uploadImage(file);
    }

    patientToEdit.photoName = file ? imageUrl : patientToEdit.photoName;
    patientToEdit.updatedAt = new Date();
    patientToEdit.updatedBy = { id: parseInt(userId) } as User;
    patientToEdit.name = patient.name;
    patientToEdit.ownerName = patient.ownerName;
    patientToEdit.ownerPhoneNumber = patient.ownerPhoneNumber;
    patientToEdit.animalId = { id: patient.animalId } as AnimalType;
    patientToEdit.genderId = { id: patient.genderId } as GenderType;
    patientToEdit.raceId = patient.raceId
      ? ({ id: patient.raceId } as RaceType)
      : null;
    patientToEdit.animalColorId = { id: patient.animalColorId } as AnimalColor;
    patientToEdit.insuranceId = { id: patient.insuranceId } as InsuranceType;
    patientToEdit.foodTypeId = { id: patient.foodTypeId } as FoodType;

    // Update case daily details
    const createdAt = new Date();

    if (caseDetailsDataArr) {
      // Deleting the previous case details medicines
      await this.deletePreviousCaseDetailsMedicines({
        id: patientCase.id,
      } as Case);

      // Deleting previous case details options (Like food extras, examinations...)
      await this.deletePreviousCaseDetailsOptions({
        id: patientCase.id,
      } as Case);

      for (let i = 0; i < caseDetailsDataArr.length; i++) {
        const caseDetailsData = caseDetailsDataArr[i];
        const caseMedicines = caseDetailsData[0].medicines;
        const caseFluids = caseDetailsData[0].fluids;
        const caseFoodExtras = caseDetailsData[0].foodExtras;
        const caseProcedures = caseDetailsData[0].procedures;
        const caseExaminations = caseDetailsData[0].examinations;
        const lastCaseObj =
          caseDetailsDataArr[caseDetailsDataArr.length > 1 ? 1 : 0];
        const lastCaseDate = lastCaseObj[lastCaseObj.length - 1].date;
        const today = new Date();

        let caseMedicinesObjects: CaseMedicines[] = [];
        let caseFluidsObjects: CaseMedicines[] = [];
        let caseFoodExtrasObjects: CaseFoodExtras[] = [];
        let caseProceduresObjects: CaseProcedures[] = [];
        let caseExaminationsObjects: CaseExaminations[] = [];
        let isCreatedCaseDetailsObjects = false;

        let currentDate =
          !lastCaseDate || (lastCaseDate && today > new Date(lastCaseDate))
            ? today
            : new Date(lastCaseDate);
        currentDate.setHours(0, 0, 0, 0);
        let previousHour = null;

        for (let i = 1; i < caseDetailsData.length; i++) {
          const caseDetail = caseDetailsData[i];
          const caseDailyDetailsId = caseDetail.id;
          const time = parseInt(caseDetail.time.split(":")[0]) + ":00:00";

          // Setting the date
          const relevantDateResult = this.getRelevantDate(
            currentDate,
            previousHour,
            time
          );
          currentDate = relevantDateResult.currentDate;
          previousHour = relevantDateResult.currentHour;
          const date = relevantDateResult.dateTime;

          const temp = caseDetail.T ? parseFloat(caseDetail.T) : null;
          const pulse = caseDetail.P ? parseFloat(caseDetail.P) : null;
          const respiration = caseDetail.R ? parseFloat(caseDetail.R) : null;
          const urineType = caseDetail.urineTypeId
            ? ({ id: caseDetail.urineTypeId } as UrineType)
            : null;
          const urineComments = caseDetail.urineComments
            ? caseDetail.urineComments
            : null;
          const fecesType = caseDetail.fecesTypeId
            ? ({ id: caseDetail.fecesTypeId } as FecesType)
            : null;
          const fecesComments = caseDetail.fecesComments
            ? caseDetail.fecesComments
            : null;
          const isBoxClean = caseDetail.isBoxClean
            ? caseDetail.isBoxClean
            : null;
          const isRelease = caseDetail.isRelease ? caseDetail.isRelease : null;
          const isWalkTrip = caseDetail.isTravel ? caseDetail.isTravel : null;
          const isPuke = caseDetail.isPuke ? caseDetail.isPuke : null;
          const pukeComments = caseDetail.pukeComments
            ? caseDetail.pukeComments
            : null;
          const weigh = caseDetail.weigh ? parseFloat(caseDetail.weigh) : null;
          const foodAndWater = caseDetail.foodAndWater
            ? caseDetail.foodAndWater
            : null;
          const comments = caseDetail.comments ? caseDetail.comments : null;
          const ownerUpdate = caseDetail.ownerUpdate
            ? caseDetail.ownerUpdate
            : null;

          let caseDailyDetails =
            caseDailyDetailsId && caseDailyDetailsId > 0
              ? await this.caseDailyDetailsRepository.findOneBy({
                id: caseDailyDetailsId,
              })
              : null;

          if (caseDailyDetails == null) {
            const newCaseDailyDetails =
              await this.caseDailyDetailsRepository.save({
                caseId: patientCase,
                date: date,
                time: time,
                createdAt: createdAt,
                createdBy: { id: parseInt(userId) } as User,
                temp: temp,
                tempIsRequired: caseDetail.T_is_required,
                tempIsEditable: caseDetail.T_is_editable,
                pulse: pulse,
                pulseIsRequired: caseDetail.P_is_required,
                pulseIsEditable: caseDetail.P_is_editable,
                respiration: respiration,
                respirationIsRequired: caseDetail.R_is_required,
                respirationIsEditable: caseDetail.R_is_editable,
                urineTypeId: urineType,
                urineComments: urineComments,
                urineIsRequired: caseDetail.urine_is_required,
                urineIsEditable: caseDetail.urine_is_editable,
                fecesTypeId: fecesType,
                fecesComments: fecesComments,
                fecesIsRequired: caseDetail.feces_is_required,
                fecesIsEditable: caseDetail.feces_is_editable,
                isBoxClean: isBoxClean,
                isBoxCleanIsRequired: caseDetail.isBoxClean_is_required,
                isBoxCleanIsEditable: caseDetail.isBoxClean_is_editable,
                isRelease: isRelease,
                isReleaseIsRequired: caseDetail.isRelease_is_required,
                isReleaseIsEditable: caseDetail.isRelease_is_editable,
                isWalkTrip: isWalkTrip,
                isWalkTripIsRequired: caseDetail.isTravel_is_required,
                isWalkTripIsEditable: caseDetail.isTravel_is_editable,
                isPuke: isPuke,
                pukeComments: pukeComments,
                pukeIsRequired: caseDetail.puke_is_required,
                pukeIsEditable: caseDetail.puke_is_editable,
                weigh: weigh,
                weighIsRequired: caseDetail.weigh_is_required,
                weighIsEditable: caseDetail.weigh_is_editable,
                foodAndWater: foodAndWater,
                foodAndWaterIsRequired: caseDetail.foodAndWater_is_required,
                foodAndWaterIsEditable: caseDetail.foodAndWater_is_editable,
                comments: comments,
                commentsIsRequired: caseDetail.comments_is_required,
                commentsIsEditable: caseDetail.comments_is_editable,
                ownerUpdate: ownerUpdate,
                ownerUpdateIsRequired: caseDetail.ownerUpdate_is_required,
                ownerUpdateIsEditable: caseDetail.ownerUpdate_is_editable,
              });

            if (!isCreatedCaseDetailsObjects) {
              // Saving the new case objects
              caseMedicinesObjects = caseMedicines
                ? await this.createNewCaseMedicinesObjects(
                  caseMedicines,
                  userId,
                  patientCase,
                  true
                )
                : [];

              caseFluidsObjects = caseFluids
                ? await this.createNewCaseMedicinesObjects(
                  caseFluids,
                  userId,
                  patientCase,
                  false
                )
                : [];

              caseFoodExtrasObjects = caseFoodExtras
                ? ((await this.createNewCaseOptionsObjects(
                  caseFoodExtras,
                  userId,
                  patientCase,
                  "foodExtras"
                )) as CaseFoodExtras[])
                : [];

              caseProceduresObjects = caseProcedures
                ? ((await this.createNewCaseOptionsObjects(
                  caseProcedures,
                  userId,
                  patientCase,
                  "procedures"
                )) as CaseProcedures[])
                : [];

              caseExaminationsObjects = caseExaminations
                ? ((await this.createNewCaseOptionsObjects(
                  caseExaminations,
                  userId,
                  patientCase,
                  "examinations"
                )) as CaseExaminations[])
                : [];

              isCreatedCaseDetailsObjects = true;
            }

            // Update each objects value by hour
            for (let j = 0; j < caseMedicinesObjects.length; j++) {
              const caseMedicineObj = caseMedicinesObjects[j];
              const caseMedicine = caseDetail.medicines[
                caseMedicineObj.medicineId.id
              ] as any;
              this.createCaseDetailsMedicine(
                caseMedicineObj,
                newCaseDailyDetails,
                userId,
                caseMedicine.isGiven,
                caseMedicine.isRequired,
                caseMedicine.isEditable,
                caseMedicine.comment
              );
            }

            for (let j = 0; j < caseFluidsObjects.length; j++) {
              const caseFluidObj = caseFluidsObjects[j];
              const caseFluid = caseDetail.fluids[
                caseFluidObj.medicineId.id
              ] as any;
              this.createCaseDetailsMedicine(
                caseFluidObj,
                newCaseDailyDetails,
                userId,
                caseFluid.isGiven,
                caseFluid.isRequired,
                caseFluid.isEditable,
                caseFluid.comment
              );
            }

            for (let j = 0; j < caseFoodExtrasObjects.length; j++) {
              const caseFoodExtraObj = caseFoodExtrasObjects[j];
              const caseFoodExtra = caseDetail.foodExtras[
                caseFoodExtraObj.foodExtraId.id
              ] as any;
              this.createCaseDetailsOptions(
                caseFoodExtraObj,
                newCaseDailyDetails,
                userId,
                caseFoodExtra.isGiven,
                caseFoodExtra.isRequired,
                caseFoodExtra.isEditable,
                "foodExtras"
              );
            }

            for (let j = 0; j < caseProceduresObjects.length; j++) {
              const caseProcedureObj = caseProceduresObjects[j];
              const caseProcedure = caseDetail.procedures[
                caseProcedureObj.procedureTypeId.id
              ] as any;
              this.createCaseDetailsOptions(
                caseProcedureObj,
                newCaseDailyDetails,
                userId,
                caseProcedure.isGiven,
                caseProcedure.isRequired,
                caseProcedure.isEditable,
                "procedures"
              );
            }

            for (let j = 0; j < caseExaminationsObjects.length; j++) {
              const caseExaminationObj = caseExaminationsObjects[j];
              this.createCaseDetailsOptions(
                caseExaminationObj,
                newCaseDailyDetails,
                userId,
                (
                  caseDetail.examinations[
                  caseExaminationObj.examinationId.id
                  ] as any
                ).value,
                (
                  caseDetail.examinations[
                  caseExaminationObj.examinationId.id
                  ] as any
                ).isRequired,
                (
                  caseDetail.examinations[
                  caseExaminationObj.examinationId.id
                  ] as any
                ).isEditable,
                "examinations"
              );
            }
          } else {
            caseDailyDetails.time = time;
            caseDailyDetails.temp = temp;
            caseDailyDetails.tempIsRequired = caseDetail.T_is_required;
            caseDailyDetails.tempIsEditable = caseDetail.T_is_editable;
            caseDailyDetails.pulse = pulse;
            caseDailyDetails.pulseIsRequired = caseDetail.P_is_required;
            caseDailyDetails.pulseIsEditable = caseDetail.P_is_editable;
            caseDailyDetails.respiration = respiration;
            caseDailyDetails.respirationIsRequired = caseDetail.R_is_required;
            caseDailyDetails.respirationIsEditable = caseDetail.R_is_editable;
            caseDailyDetails.urineTypeId = urineType;
            caseDailyDetails.urineComments = urineComments;
            caseDailyDetails.urineIsRequired = caseDetail.urine_is_required;
            caseDailyDetails.urineIsEditable = caseDetail.urine_is_editable;
            caseDailyDetails.fecesTypeId = fecesType;
            caseDailyDetails.fecesComments = fecesComments;
            caseDailyDetails.fecesIsRequired = caseDetail.feces_is_required;
            caseDailyDetails.fecesIsEditable = caseDetail.feces_is_editable;
            caseDailyDetails.isBoxClean = isBoxClean;
            caseDailyDetails.isBoxCleanIsRequired =
              caseDetail.isBoxClean_is_required;
            caseDailyDetails.isBoxCleanIsEditable =
              caseDetail.isBoxClean_is_editable;
            caseDailyDetails.isRelease = isRelease;
            caseDailyDetails.isReleaseIsRequired =
              caseDetail.isRelease_is_required;
            caseDailyDetails.isReleaseIsEditable =
              caseDetail.isRelease_is_editable;
            caseDailyDetails.isWalkTrip = isWalkTrip;
            caseDailyDetails.isWalkTripIsRequired =
              caseDetail.isTravel_is_required;
            caseDailyDetails.isWalkTripIsEditable =
              caseDetail.isTravel_is_editable;
            caseDailyDetails.isPuke = isPuke;
            caseDailyDetails.pukeComments = pukeComments;
            caseDailyDetails.pukeIsRequired = caseDetail.puke_is_required;
            caseDailyDetails.pukeIsEditable = caseDetail.puke_is_editable;
            caseDailyDetails.weigh = weigh;
            caseDailyDetails.weighIsRequired = caseDetail.weigh_is_required;
            caseDailyDetails.weighIsEditable = caseDetail.weigh_is_editable;
            caseDailyDetails.foodAndWater = foodAndWater;
            caseDailyDetails.foodAndWaterIsRequired =
              caseDetail.foodAndWater_is_required;
            caseDailyDetails.foodAndWaterIsEditable =
              caseDetail.foodAndWater_is_editable;
            caseDailyDetails.comments = comments;
            caseDailyDetails.commentsIsRequired =
              caseDetail.comments_is_required;
            caseDailyDetails.commentsIsEditable =
              caseDetail.comments_is_editable;
            caseDailyDetails.ownerUpdate = ownerUpdate;
            caseDailyDetails.ownerUpdateIsRequired =
              caseDetail.ownerUpdate_is_required;
            caseDailyDetails.ownerUpdateIsEditable =
              caseDetail.ownerUpdate_is_editable;

            if (!isCreatedCaseDetailsObjects) {
              // Saving the new case details objects
              caseMedicinesObjects = caseMedicines
                ? await this.createNewCaseMedicinesObjects(
                  caseMedicines,
                  userId,
                  patientCase,
                  true
                )
                : [];
              caseFluidsObjects = caseFluids
                ? await this.createNewCaseMedicinesObjects(
                  caseFluids,
                  userId,
                  patientCase,
                  false
                )
                : [];

              caseFoodExtrasObjects = caseFoodExtras
                ? ((await this.createNewCaseOptionsObjects(
                  caseFoodExtras,
                  userId,
                  patientCase,
                  "foodExtras"
                )) as CaseFoodExtras[])
                : [];

              caseProceduresObjects = caseProcedures
                ? ((await this.createNewCaseOptionsObjects(
                  caseProcedures,
                  userId,
                  patientCase,
                  "procedures"
                )) as CaseProcedures[])
                : [];

              caseExaminationsObjects = caseExaminations
                ? ((await this.createNewCaseOptionsObjects(
                  caseExaminations,
                  userId,
                  patientCase,
                  "examinations"
                )) as CaseExaminations[])
                : [];

              isCreatedCaseDetailsObjects = true;
            }

            // Update each object value by hour
            for (let j = 0; j < caseMedicinesObjects.length; j++) {
              const caseMedicineObj = caseMedicinesObjects[j];
              const caseMedicine = (caseDetail.medicines as any)[
                caseMedicineObj.medicineId.id
              ] as any;
              this.createCaseDetailsMedicine(
                caseMedicineObj,
                caseDailyDetails,
                userId,
                caseMedicine.isGiven,
                caseMedicine.isRequired,
                caseMedicine.isEditable,
                caseMedicine.comment
              );
            }

            for (let j = 0; j < caseFluidsObjects.length; j++) {
              const caseFluidObj = caseFluidsObjects[j];
              const caseFluid = (caseDetail.fluids as any)[
                caseFluidObj.medicineId.id
              ] as any;
              this.createCaseDetailsMedicine(
                caseFluidObj,
                caseDailyDetails,
                userId,
                caseFluid.isGiven,
                caseFluid.isRequired,
                caseFluid.isEditable,
                caseFluid.comment
              );
            }

            for (let j = 0; j < caseFoodExtrasObjects.length; j++) {
              const caseFoodExtraObj = caseFoodExtrasObjects[j];
              const caseFoodExtra = (caseDetail.foodExtras as any)[
                caseFoodExtraObj.foodExtraId.id
              ] as any;
              this.createCaseDetailsOptions(
                caseFoodExtraObj,
                caseDailyDetails,
                userId,
                caseFoodExtra.isGiven,
                caseFoodExtra.isRequired,
                caseFoodExtra.isEditable,
                "foodExtras"
              );
            }

            for (let j = 0; j < caseProceduresObjects.length; j++) {
              const caseProcedureObj = caseProceduresObjects[j];
              const caseProcedure = (caseDetail.procedures as any)[
                caseProcedureObj.procedureTypeId.id
              ] as any;
              this.createCaseDetailsOptions(
                caseProcedureObj,
                caseDailyDetails,
                userId,
                caseProcedure.isGiven,
                caseProcedure.isRequired,
                caseProcedure.isEditable,
                "procedures"
              );
            }

            for (let j = 0; j < caseExaminationsObjects.length; j++) {
              const caseExaminationObj = caseExaminationsObjects[j];
              this.createCaseDetailsOptions(
                caseExaminationObj,
                caseDailyDetails,
                userId,
                (
                  (caseDetail.examinations as any)[
                  caseExaminationObj.examinationId.id
                  ] as any
                ).value,
                (
                  (caseDetail.examinations as any)[
                  caseExaminationObj.examinationId.id
                  ] as any
                ).isRequired,
                (
                  (caseDetail.examinations as any)[
                  caseExaminationObj.examinationId.id
                  ] as any
                ).isEditable,
                "examinations"
              );
            }

            await this.caseDailyDetailsRepository.save(caseDailyDetails);
          }
        }
      }
    }

    // Save changes
    await this.PatientRepository.save(patientToEdit);
    await this.CaseService.saveCase(patientCase);

    await this.auditLogServiceService.audit({
      subject: "עדכון פרטי מטופל",
      description: "מטופל עודכן במערכת",
      patientId: patientToEdit.id,
      caseId: patientCase ? patientCase.id : undefined,
      userId: parseInt(userId),
    });

    return patientToEdit;
  }

  async validateCaseDetailsList(
    caseId: string,
    caseDetailsList: CaseDetailsData[][] | undefined
  ) {
    const errorMessage = "דף טיפולים עבור תאריך זה כבר קיים";
    if (!caseDetailsList) throw new Error(errorMessage);
    if (caseDetailsList[0][1].date) return;

    const mostRecentDate = new Date(caseDetailsList[1][1].date);
    mostRecentDate.setDate(mostRecentDate.getDate() + 2);
    const result = await this.caseDailyDetailsRepository.findBy({
      caseId: { id: caseId } as Case,
      date: mostRecentDate,
    });
    if (result.length > 0) throw new Error(errorMessage);
  }

  async createNewCaseMedicinesObjects(
    caseMedicines: any,
    userId: string,
    patientCase: Case,
    isMedicine: boolean
  ) {
    let caseMedicinesObjects = [];
    if (caseMedicines) {
      for (let i = 0; i < caseMedicines.length; i++) {
        caseMedicinesObjects.push(
          await this.createCaseDailyDetailsMedicine(
            patientCase.id,
            caseMedicines[i],
            userId,
            isMedicine
          )
        );
      }
    }

    return caseMedicinesObjects;
  }

  async createNewCaseOptionsObjects(
    caseOptions: any,
    userId: string,
    patientCase: Case,
    type: string
  ) {
    let caseOptionsObjects = [];
    if (caseOptions) {
      for (let i = 0; i < caseOptions.length; i++) {
        caseOptionsObjects.push(
          await this.createCaseDailyDetailsOptions(
            patientCase.id,
            caseOptions[i],
            userId,
            type
          )
        );
      }
    }

    return caseOptionsObjects;
  }

  async createCaseDetailsMedicine(
    caseMedicine: CaseMedicines,
    caseDailyDetails: CaseDailyDetails,
    userId: string,
    isGiven: boolean,
    isRequired: boolean,
    isEditable: boolean,
    comment: string | null
  ) {
    await this.caseDailyDetailsMedicinesRepository.save({
      caseMedicinesId: { id: caseMedicine.id } as CaseMedicines,
      caseDailyDetailsId: {
        id: caseDailyDetails.id,
      } as CaseDailyDetails,
      createdAt: new Date(),
      createdBy: { id: parseInt(userId) } as User,
      isGiven: isGiven,
      isRequired: isRequired,
      isEditable: isEditable,
      comment: comment,
    });
  }

  async createCaseDetailsOptions(
    caseOptions: any,
    caseDailyDetails: CaseDailyDetails,
    userId: string,
    value: any,
    isRequired: boolean,
    isEditable: boolean,
    type: string
  ) {
    if (type === "foodExtras") {
      await this.caseDailyDetailsFoodExtrasRepository.save({
        caseFoodExtrasId: { id: caseOptions.id } as CaseFoodExtras,
        caseDailyDetailsId: {
          id: caseDailyDetails.id,
        } as CaseDailyDetails,
        createdAt: new Date(),
        createdBy: { id: parseInt(userId) } as User,
        isGiven: value,
        isRequired: isRequired,
        isEditable: isEditable,
      });
    } else if (type === "procedures") {
      await this.caseDailyDetailsProceduresRepository.save({
        caseProceduresId: { id: caseOptions.id } as CaseProcedures,
        caseDailyDetailsId: {
          id: caseDailyDetails.id,
        } as CaseDailyDetails,
        createdAt: new Date(),
        createdBy: { id: parseInt(userId) } as User,
        isGiven: value,
        isRequired: isRequired,
        isEditable: isEditable,
      });
    } else {
      await this.caseDailyDetailsExaminationsRepository.save({
        caseExaminationsId: { id: caseOptions.id } as CaseExaminations,
        caseDailyDetailsId: {
          id: caseDailyDetails.id,
        } as CaseDailyDetails,
        createdAt: new Date(),
        createdBy: { id: parseInt(userId) } as User,
        value: value,
        isRequired: isRequired,
        isEditable: isEditable,
      });
    }
  }

  async createCaseDailyDetailsMedicine(
    caseId: string,
    medicine: CaseDetailsMedicineObj,
    userId: string,
    isMedicine: boolean
  ) {
    return await this.caseMedicinesRepository.save({
      caseId: { id: caseId } as Case,
      medicineId: { id: parseInt(medicine.value) } as Medicine,
      createdAt: new Date(),
      createdBy: { id: parseInt(userId) } as User,
      frequencyId: { id: medicine.frequencyId } as DosageFrequency,
      doseAmount: medicine.doseAmount,
      routeOfAdministrationId: {
        id: medicine.medicineRouteId,
      } as RouteOfAdministration,
      isMedicine: isMedicine,
    });
  }

  async createCaseDailyDetailsOptions(
    caseId: string,
    option: CaseDetailsOptionsObj,
    userId: string,
    type: string
  ) {
    if (type === "foodExtras") {
      return await this.caseFoodExtrasRepository.save({
        caseId: { id: caseId } as Case,
        foodExtraId: { id: parseInt(option.value) } as FoodExtraType,
        createdAt: new Date(),
        createdBy: { id: parseInt(userId) } as User,
        type: type,
      });
    } else if (type === "procedures") {
      return await this.caseProceduresRepository.save({
        caseId: { id: caseId } as Case,
        procedureTypeId: { id: parseInt(option.value) } as ProcedureType,
        createdAt: new Date(),
        createdBy: { id: parseInt(userId) } as User,
        type: type,
      });
    } else {
      return await this.caseExaminationsRepository.save({
        caseId: { id: caseId } as Case,
        examinationId: { id: parseInt(option.value) } as ExaminationType,
        createdAt: new Date(),
        createdBy: { id: parseInt(userId) } as User,
        type: type,
      });
    }
  }

  async deleteCaseDetailsMedicines(caseDailyDetails: CaseDailyDetails) {
    await this.caseDailyDetailsMedicinesRepository.delete({
      caseDailyDetailsId: { id: caseDailyDetails.id } as CaseDailyDetails,
    });
  }

  async deleteCaseDetailsOptions(caseDailyDetails: CaseDailyDetails) {
    await this.caseDailyDetailsExaminationsRepository.delete({
      caseDailyDetailsId: { id: caseDailyDetails.id } as CaseDailyDetails,
    });
    await this.caseDailyDetailsProceduresRepository.delete({
      caseDailyDetailsId: { id: caseDailyDetails.id } as CaseDailyDetails,
    });
    await this.caseDailyDetailsFoodExtrasRepository.delete({
      caseDailyDetailsId: { id: caseDailyDetails.id } as CaseDailyDetails,
    });
  }

  async deletePreviousCaseDetailsMedicines(patientCase: Case) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      // Deleting all previous case details medicines
      await queryRunner.query(sqlQueries.deletePreviousCaseDetailsMedicines, [
        patientCase.id,
      ]);

      await this.caseMedicinesRepository.delete({
        caseId: { id: patientCase.id } as Case,
      });
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async deletePreviousCaseDetailsOptions(patientCase: Case) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      // Deleting all previous case details food extras
      await queryRunner.query(sqlQueries.deletePreviousCaseDetailsFoodExtras, [
        patientCase.id,
      ]);

      await this.caseFoodExtrasRepository.delete({
        caseId: { id: patientCase.id } as Case,
      });

      // Deleting all previous case details procedures
      await queryRunner.query(sqlQueries.deletePreviousCaseDetailsProcedures, [
        patientCase.id,
      ]);

      await this.caseProceduresRepository.delete({
        caseId: { id: patientCase.id } as Case,
      });

      // Deleting all previous case details examinations
      await queryRunner.query(
        sqlQueries.deletePreviousCaseDetailsExaminations,
        [patientCase.id]
      );

      await this.caseExaminationsRepository.delete({
        caseId: { id: patientCase.id } as Case,
      });
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getCaseDetailsMedicinesByCaseDailyDetailsId(
    caseDailyDetailsId: number
  ): Promise<CaseDailyDetailsMedicines[]> {
    return await this.caseDailyDetailsMedicinesRepository.find({
      where: {
        caseDailyDetailsId: { id: caseDailyDetailsId } as CaseDailyDetails,
      },
    });
  }

  async deleteDailyCaseDetails(currCase: Case) {
    await this.caseDailyDetailsRepository.delete({
      caseId: { id: currCase.id } as Case,
    });
  }

  async getCaseDetailsByCaseId(caseId: string): Promise<CaseDailyDetails[]> {
    return await this.caseDailyDetailsRepository.find({
      where: { caseId: { id: caseId } as Case },
    });
  }

  async deletePatientMedicine(currCase: Case) {
    await this.patientMedicineRepository.delete({
      caseId: { id: currCase.id } as Case,
    });
  }

  async deleteCaseAnesthesiaProcedureForm(caseId: string) {
    await this.anesthesiaProcedureFormRepository.delete({
      caseId: { id: caseId } as Case,
    });
  }

  async getPatientMedicineByCaseId(caseId: string): Promise<PatientMedicine[]> {
    return await this.patientMedicineRepository.find({
      where: { caseId: { id: caseId } as Case },
    });
  }

  async deletePatientById(id: number) {
    await this.PatientRepository.delete({
      id: id,
    });
  }

  async getCaseDailyDetailsMedicines(
    caseMedicineId: number,
    caseDailyDetailsId: number
  ) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      return await queryRunner.query(sqlQueries.getCaseDailyDetailsMedicines, [
        caseMedicineId,
        caseDailyDetailsId,
      ]);
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getCaseDetailsMedicines(
    caseId: string,
    caseDailyDetailsIds: number[],
    isMedicine: boolean
  ) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      return await queryRunner.query(sqlQueries.getCaseDetailsMedicines, [
        caseId,
        isMedicine,
        caseDailyDetailsIds,
      ]);
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getCaseDetailsOptions(
    caseId: string,
    caseDailyDetailsIds: number[],
    type: string
  ) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      let query;
      if (type == "foodExtras") query = sqlQueries.getCaseDetailsFoodExtras;
      else if (type == "procedures")
        query = sqlQueries.getCaseDetailsProcedures;
      else query = sqlQueries.getCaseDetailsExaminations;

      return await queryRunner.query(query, [caseId, caseDailyDetailsIds]);
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getCaseDailyDetailsOptions(
    caseOptionsId: number,
    caseDailyDetailsIds: number[],
    type: string
  ) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      let query;
      if (type == "foodExtras")
        query = sqlQueries.getCaseDailyDetailsFoodExtras;
      else if (type == "procedures")
        query = sqlQueries.getCaseDailyDetailsProcedures;
      else query = sqlQueries.getCaseDailyDetailsExaminations;

      return await queryRunner.query(query, [
        caseOptionsId,
        caseDailyDetailsIds,
      ]);
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getAnesthesiaProcedureForm(caseId: string) {
    const res = await this.anesthesiaProcedureFormRepository.find({
      where: { caseId: { id: caseId } },
      select: [
        "caseId",
        "ownerName",
        "name",
        "isFastSinceMidnight",
        "isDistortionHistory",
        "isMedicationsSensitive",
        "isNeedToMarkEar",
        "isSterilization",
        "isPriceIncludesReleaseMedications",
        "plannedProcedure",
        "priceEstimate",
        "date",
        "signature",
        "generalComments",
        "distortionComments",
        "medicationsSensitiveComments",
      ],
    });
    if (res.length == 0) return null;
    else return res[0];
  }

  async anesthesiaProcedureFormNew(
    {
      name,
      ownerName,
      plannedProcedure,
      priceEstimate,
      date,
      isFastSinceMidnight,
      isDistortionHistory,
      isMedicationsSensitive,
      isNeedToMarkEar,
      isSterilization,
      isPriceIncludesReleaseMedications,
      caseId,
      signature,
      generalComments,
      distortionComments,
      medicationsSensitiveComments,
    }: AnesthesiaProcedureFormData,
    { userId }: TokenUser
  ) {
    await this.anesthesiaProcedureFormRepository.save({
      name: name,
      ownerName: ownerName,
      createdAt: new Date(),
      createdBy: { id: parseInt(userId) } as User,
      plannedProcedure: plannedProcedure,
      priceEstimate: priceEstimate,
      date: date,
      isFastSinceMidnight: isFastSinceMidnight,
      isDistortionHistory: isDistortionHistory,
      isMedicationsSensitive: isMedicationsSensitive,
      isNeedToMarkEar: isNeedToMarkEar,
      isSterilization: isSterilization,
      isPriceIncludesReleaseMedications: isPriceIncludesReleaseMedications,
      caseId: { id: caseId } as Case,
      signature: signature,
      generalComments: generalComments,
      distortionComments: distortionComments,
      medicationsSensitiveComments: medicationsSensitiveComments,
    });
  }

  async anesthesiaProcedureFormEdit(
    {
      name,
      ownerName,
      plannedProcedure,
      priceEstimate,
      date,
      isFastSinceMidnight,
      isDistortionHistory,
      isMedicationsSensitive,
      isNeedToMarkEar,
      isSterilization,
      isPriceIncludesReleaseMedications,
      caseId,
      signature,
      generalComments,
      distortionComments,
      medicationsSensitiveComments,
    }: AnesthesiaProcedureFormData,
    { userId }: TokenUser
  ) {
    const anesthesiaProcedureForm =
      await this.anesthesiaProcedureFormRepository.findOneBy({
        caseId: { id: caseId } as Case,
      });
    if (!anesthesiaProcedureForm) throw new Error("הפרטים לא נמצאו");

    anesthesiaProcedureForm.name = name;
    anesthesiaProcedureForm.ownerName = ownerName;
    anesthesiaProcedureForm.updatedAt = new Date();
    anesthesiaProcedureForm.updatedBy = { id: parseInt(userId) } as User;
    anesthesiaProcedureForm.plannedProcedure = plannedProcedure;
    anesthesiaProcedureForm.priceEstimate = priceEstimate;
    anesthesiaProcedureForm.date = date ? new Date(date) : null;
    anesthesiaProcedureForm.isFastSinceMidnight = isFastSinceMidnight;
    anesthesiaProcedureForm.isDistortionHistory = isDistortionHistory;
    anesthesiaProcedureForm.isMedicationsSensitive = isMedicationsSensitive;
    anesthesiaProcedureForm.isNeedToMarkEar = isNeedToMarkEar;
    anesthesiaProcedureForm.isSterilization = isSterilization;
    anesthesiaProcedureForm.isPriceIncludesReleaseMedications =
      isPriceIncludesReleaseMedications;
    anesthesiaProcedureForm.signature = signature;
    anesthesiaProcedureForm.generalComments = generalComments;
    anesthesiaProcedureForm.distortionComments = distortionComments;
    anesthesiaProcedureForm.medicationsSensitiveComments =
      medicationsSensitiveComments;
    await this.anesthesiaProcedureFormRepository.save(anesthesiaProcedureForm);
  }

  //TODO - Eliav - check this function
  async getCaseDetails(caseId: string, masterCaseId: string) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      const caseDetails = await queryRunner.query(
        sqlQueries.getPatientByCaseId,
        [caseId]
      );
      if (caseDetails.length === 0)
        throw new Error(caseId + "לא נמצא תיק מספר ");

      const caseDailyDetails = await this.getCaseDailyDetails(caseId);
      const masterCaseDetails = await this.getMasterCaseDetails(masterCaseId);

      return {
        caseDetails: caseDetails[0],
        caseDailyDetails: caseDailyDetails,
        masterCaseDetails: masterCaseDetails,
      };
    } catch (err) {
      logger.error(`${err}`);
      throw err;
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getMasterCaseDetails(masterCaseId: string) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      return await queryRunner.query(sqlQueries.getMasterCaseDetails, [
        masterCaseId,
      ]);
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getCaseDailyDetails(caseId: string) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      const caseDailyDetails = await queryRunner.query(
        sqlQueries.getCaseDailyDetails,
        [caseId]
      );
      if (caseDailyDetails.length == 0) return null;

      const numOfCols = DAILY_CASE_TABLE_COL_NUM - 1;
      let dailyCaseMedicines = [];
      let dailyCaseFluids = [];
      let dailyCaseFoodExtras = [];
      let dailyCaseProcedures = [];
      let dailyCaseExaminations = [];

      const result = [] as any;
      let resultItem = [] as any;
      for (let i = 0; i < caseDailyDetails.length; i++) {
        const medicinesObj = (caseDailyDetails[i].medicines = {});
        const fluidsObj = (caseDailyDetails[i].fluids = {});
        const foodExtrasObj = (caseDailyDetails[i].foodExtras = {});
        const proceduresObj = (caseDailyDetails[i].procedures = {});
        const examinationsObj = (caseDailyDetails[i].examinations = {});

        if (i % numOfCols === 0) {
          const caseDailyDetailsIds = caseDailyDetails
            .slice(i, i + numOfCols)
            .map((caseDailyDetail: any) => caseDailyDetail.id);
          dailyCaseMedicines = await this.getCaseDetailsMedicines(
            caseId,
            caseDailyDetailsIds,
            true
          );
          dailyCaseFluids = await this.getCaseDetailsMedicines(
            caseId,
            caseDailyDetailsIds,
            false
          );
          dailyCaseFoodExtras = await this.getCaseDetailsOptions(
            caseId,
            caseDailyDetailsIds,
            "foodExtras"
          );
          dailyCaseProcedures = await this.getCaseDetailsOptions(
            caseId,
            caseDailyDetailsIds,
            "procedures"
          );
          dailyCaseExaminations = await this.getCaseDetailsOptions(
            caseId,
            caseDailyDetailsIds,
            "examinations"
          );
        }

        for (let j = 0; j < dailyCaseMedicines.length; j++) {
          const caseMedicinesId = dailyCaseMedicines[j].id;
          const medicineId = dailyCaseMedicines[j].value;
          const res = await this.getCaseDailyDetailsMedicines(
            caseMedicinesId,
            caseDailyDetails[i].id
          );

          (medicinesObj as any)[medicineId] = {
            isGiven: res.length == 0 ? false : res[0].isGiven,
            isRequired: res.length == 0 ? false : res[0].isRequired,
            isEditable: res.length == 0 ? true : res[0].isEditable,
            comment: res.length == 0 ? null : res[0].comment,
          };
        }

        for (let j = 0; j < dailyCaseFluids.length; j++) {
          const caseMedicinesId = dailyCaseFluids[j].id;
          const medicineId = dailyCaseFluids[j].value;
          const res = await this.getCaseDailyDetailsMedicines(
            caseMedicinesId,
            caseDailyDetails[i].id
          );

          (fluidsObj as any)[medicineId] = {
            isGiven: res.length == 0 ? false : res[0].isGiven,
            isRequired: res.length == 0 ? false : res[0].isRequired,
            isEditable: res.length == 0 ? true : res[0].isEditable,
            comment: res.length == 0 ? null : res[0].comment,
          };
        }

        for (let j = 0; j < dailyCaseFoodExtras.length; j++) {
          const caseFoodExtrasId = dailyCaseFoodExtras[j].id;
          const foodExtrasId = dailyCaseFoodExtras[j].value;
          const res = await this.getCaseDailyDetailsOptions(
            caseFoodExtrasId,
            caseDailyDetails[i].id,
            "foodExtras"
          );

          (foodExtrasObj as any)[foodExtrasId] = {
            isGiven: res.length == 0 ? false : res[0].isGiven,
            isRequired: res.length == 0 ? false : res[0].isRequired,
            isEditable: res.length == 0 ? true : res[0].isEditable,
          };
        }

        for (let j = 0; j < dailyCaseProcedures.length; j++) {
          const caseProceduresId = dailyCaseProcedures[j].id;
          const procedureId = dailyCaseProcedures[j].value;
          const res = await this.getCaseDailyDetailsOptions(
            caseProceduresId,
            caseDailyDetails[i].id,
            "procedures"
          );

          (proceduresObj as any)[procedureId] = {
            isGiven: res.length == 0 ? false : res[0].isGiven,
            isRequired: res.length == 0 ? false : res[0].isRequired,
            isEditable: res.length == 0 ? true : res[0].isEditable,
          };
        }

        for (let j = 0; j < dailyCaseExaminations.length; j++) {
          const caseExaminationsId = dailyCaseExaminations[j].id;
          const examinationId = dailyCaseExaminations[j].value;
          const res = await this.getCaseDailyDetailsOptions(
            caseExaminationsId,
            caseDailyDetails[i].id,
            "examinations"
          );

          (examinationsObj as any)[examinationId] = {
            value: res.length == 0 ? "" : res[0].value,
            isRequired: res.length == 0 ? false : res[0].isRequired,
            isEditable: res.length == 0 ? true : res[0].isEditable,
          };
        }

        caseDailyDetails[i].index = i + 1;
        resultItem.push(caseDailyDetails[i]);
        if ((i + 1) % numOfCols == 0) {
          resultItem.unshift({
            medicines: dailyCaseMedicines.sort((a: any, b: any) =>
              a.text.localeCompare(b.text)
            ), // Sort by the medicine name
            fluids: dailyCaseFluids.sort((a: any, b: any) =>
              a.text.localeCompare(b.text)
            ), // Sort by the medicine name
            foodExtras: dailyCaseFoodExtras.sort((a: any, b: any) =>
              a.text.localeCompare(b.text)
            ), // Sort by the option name
            procedures: dailyCaseProcedures.sort((a: any, b: any) =>
              a.text.localeCompare(b.text)
            ), // Sort by the option name
            examinations: dailyCaseExaminations.sort((a: any, b: any) =>
              a.text.localeCompare(b.text)
            ), // Sort by the option name
          });

          result.push(resultItem);
          resultItem = [];
        }
      }

      return result;
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getPatientById(patientId: number): Promise<Patient | null> {
    return await this.PatientRepository.findOneBy({
      id: patientId,
    });
  }

  // Mark patient case as deleted
  async markPatientCaseDeleted(patientId: number, userId: string) {
    const currCase = await this.CaseService.getCaseByPatientId(patientId);
    if (currCase == null) throw new Error("לא נמצא תיק עם מספר זהות זה");

    currCase.isDeleted = true;
    await this.CaseService.saveCase(currCase);

    await this.auditLogServiceService.audit({
      subject: "מחיקת מטופל",
      description: "מטופל נמחק מהמערכת",
      caseId: currCase.id,
      patientId: currCase.patientId.id,
      userId: parseInt(userId),
    });
  }

  // Actually delete all related case records
  async deletePatientCase(patientId: number) {
    const currCase = await this.CaseService.getCaseByPatientId(patientId);
    if (currCase == null) throw new Error("לא נמצא תיק עם מספר זהות זה");
    const currMasterCase = await this.CaseService.getMasterCaseByCaseId(
      currCase.id
    );
    if (currMasterCase == null)
      throw new Error("לא נמצא תיק מאסטר עם מספר זהות זה");

    const caseDailyDetails = await this.getCaseDetailsByCaseId(currCase.id);

    await this.deletePreviousCaseDetailsMedicines({
      id: currCase.id,
    } as Case);

    caseDailyDetails.forEach(async (caseDailyDetails) => {
      await this.deleteCaseDetailsMedicines(caseDailyDetails);
    });

    await this.deletePreviousCaseDetailsOptions({
      id: currCase.id,
    } as Case);

    caseDailyDetails.forEach(async (caseDailyDetails) => {
      await this.deleteCaseDetailsOptions(caseDailyDetails);
    });

    await this.auditLogServiceService.deleteAllByCaseId(currCase.id);
    await this.deleteCaseAnesthesiaProcedureForm(currCase.id);
    await this.deleteDailyCaseDetails(currCase);
    await this.deletePatientMedicine(currCase);
    await this.CaseService.deleteMasterCase(currMasterCase.id, currCase.id);
    await this.CaseService.deleteCaseById(currCase.id);
    await this.deletePatientById(patientId);
  }

  async releasePatient(
    releasePatientData: ReleasePatientDTO,
    { userId }: TokenUser
  ) {
    const patientCase = await this.CaseService.getCaseById(
      releasePatientData.caseId
    );
    if (!patientCase)
      throw new Error(releasePatientData.caseId + "לא נמצא תיק מספר ");

    patientCase.releaseDate = new Date();
    patientCase.releasedBy = { id: parseInt(userId) } as User;
    patientCase.stitchesRemovalDate = releasePatientData.stitchesRemovalDate
      ? new Date(releasePatientData.stitchesRemovalDate)
      : undefined;
    patientCase.nextInspectionDate = releasePatientData.nextInspectionDate
      ? new Date(releasePatientData.nextInspectionDate)
      : undefined;

    // Delete previous medicines
    await this.patientMedicineRepository.delete({
      caseId: { id: patientCase.id } as Case,
    });

    // Save medicines
    for (let i = 0; i < releasePatientData.medicines.length; i++) {
      const medicine = releasePatientData.medicines[i];
      await this.patientMedicineRepository.save({
        medicineId: { id: parseInt(medicine.value) } as Medicine,
        createdAt: new Date(),
        createdBy: { id: parseInt(userId) } as User,
        frequencyId: { id: medicine.frequencyId } as DosageFrequency,
        doseAmount: medicine.doseAmount,
        routeOfAdministrationId: {
          id: medicine.medicineRouteId,
        } as RouteOfAdministration,
        caseId: patientCase,
      });
    }

    // Save case
    await this.CaseService.saveCase(patientCase);
  }

  async getReleasePatientData(caseId: string) {
    const patientCase = await this.CaseService.getCaseById(caseId);
    if (!patientCase) throw new Error(caseId + "לא נמצא תיק מספר ");

    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      const releaseMedicines = await queryRunner.query(
        sqlQueries.getCaseReleaseMedicines,
        [caseId]
      );

      const releaseMedicinesArray = [];
      for (let i = 0; i < releaseMedicines.length; i++) {
        const medicine = releaseMedicines[i];
        releaseMedicinesArray.push({
          value: medicine.value,
          text: medicine.text,
          measureUnitId: medicine.measureUnitId,
          measureUnitText: medicine.measureUnitText,
          frequencyId: medicine.frequencyId,
          frequencyText: medicine.frequencyText,
          doseAmount: medicine.doseAmount,
          medicineRouteId: medicine.medicineRouteId,
          medicineRouteText: medicine.medicineRouteText,
          rangeMax: medicine.rangeMax,
          rangeMin: medicine.rangeMin,
          totalDose: medicine.totalDose,
          comments: medicine.comments,
        });
      }

      return {
        releaseDate: patientCase.releaseDate,
        nextInspectionDate: patientCase.nextInspectionDate,
        stitchesRemovalDate: patientCase.stitchesRemovalDate,
        medicines: releaseMedicinesArray,
      };
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  getRelevantDate(
    currentDate: Date,
    previousHour: number | null,
    time: string
  ) {
    const [hour, minute] = time.split(":").map(Number);
    const currentHour = hour + minute / 60;

    if (previousHour !== null && currentHour <= previousHour) {
      currentDate.setDate(currentDate.getDate() + 1); // Increment to the next day
    }

    const dateTime = new Date(currentDate);
    dateTime.setHours(hour, minute, 0, 0);

    return { dateTime, currentDate, currentHour };
  }

  isValEmpty(val: any) {
    return val === null || val === "" || val === undefined || val === false;
  }

  getAgeValueInText(years: number | null, months: number | null) {
    const isYearsEmpty = this.isValEmpty(years);
    const isMonthsEmpty = this.isValEmpty(months);

    if (isYearsEmpty && isMonthsEmpty) return "";
    else if (isYearsEmpty) return `${months} חודשים`;
    else if (isMonthsEmpty) return `${years} שנים`;
    else return `${years} שנים ו ${months} חודשים`;
  }

  getLatestVitals = (caseDetailsList: CaseDetailsData[][]) => {
    let vitalsData = {
      T: { value: 0, dataDetailsIndex: 0, colIndex: 0 },
      P: { value: 0, dataDetailsIndex: 0, colIndex: 0 },
      R: { value: 0, dataDetailsIndex: 0, colIndex: 0 },
    };

    let tempFound = false;
    let pulseFound = false;
    let respirationFound = false;

    for (let i = 0; i < caseDetailsList.length; i++) {
      let caseDetail = caseDetailsList[i];
      for (let j = caseDetail.length - 1; j > 0; j--) {
        const temp = caseDetail[j].T;
        const pulse = caseDetail[j].P;
        const respiration = caseDetail[j].R;
        if (temp !== undefined && temp !== null && temp !== "" && !tempFound) {
          tempFound = true;
          vitalsData.T = {
            value: parseFloat(temp),
            dataDetailsIndex: i,
            colIndex: j,
          };
        }
        if (
          pulse !== undefined &&
          pulse !== null &&
          pulse !== "" &&
          !pulseFound
        ) {
          pulseFound = true;
          vitalsData.P = {
            value: parseFloat(pulse),
            dataDetailsIndex: i,
            colIndex: j,
          };
        }
        if (
          respiration !== undefined &&
          respiration !== null &&
          respiration !== "" &&
          !respirationFound
        ) {
          respirationFound = true;
          vitalsData.R = {
            value: parseFloat(respiration),
            dataDetailsIndex: i,
            colIndex: j,
          };
        }
      }
    }

    return vitalsData;
  };

  isValueInRange = (
    value: number | undefined | null,
    min: number | undefined,
    max: number | undefined
  ) => {
    if (
      value === undefined ||
      value === null ||
      min === undefined ||
      max === undefined
    )
      return true;
    return value >= min && value <= max;
  };

  async exportPatientCase(caseId: string, caseDailyDetailsDate: string) {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      const caseDataRes = await queryRunner.query(
        sqlQueries.getPatientByCaseId,
        [caseId]
      );
      if (caseDataRes.length === 0)
        throw new Error(caseId + "לא נמצא תיק מספר ");

      const caseData = caseDataRes[0];
      let caseDailyDataArr = await this.getCaseDailyDetails(caseId);
      if (caseDailyDataArr === null) caseDailyDataArr = [];
      else caseDailyDataArr.reverse();

      let caseDailyData = null;
      let caseDetailsDataIndex = null;
      for (let i = 0; i < caseDailyDataArr.length; i++) {
        if (caseDailyDataArr[i][1].date === caseDailyDetailsDate) {
          caseDailyData = caseDailyDataArr[i];
          caseDetailsDataIndex = i;
          break;
        }
      }

      const animalVitals = await AdminService.getAnimalVitalsByAnimalId(
        caseData.animal_type_id
      );
      let latestVitals = this.getLatestVitals(caseDailyDataArr);
      let latestTempData = latestVitals.T;
      let latestPulseData = latestVitals.P;
      let latestRespirationData = latestVitals.R;

      let data: any = {
        date: caseDailyDetailsDate
          ? caseDailyDetailsDate.split("-").reverse().join("/")
          : caseData.created_at,
        ownerName: caseData.owner_name,
        ownerPhoneNumber: caseData.owner_phone_number,
        insurance: caseData.insurance,
        referringDoctor: caseData.referring_doctor,
        caseId: caseId,
        animalName: caseData.name,
        weight: caseData.weight_kg + "KG",
        gender: caseData.gender_type,
        type: caseData.animal_type,
        color: caseData.animal_color,
        age: this.getAgeValueInText(caseData.age_years, caseData.age_months),
        breed: caseData.breed,
        isEscapePotential: caseData.is_escape_potential,
        isNPO: caseData.is_npo,
        isRiskAnesthesia: caseData.is_risk_anesthesia,
        isHeartMurmur: caseData.is_heart_murmur,
        isAMB: caseData.is_amb,
        isAggressive: caseData.is_aggressive,
        isCerenia: caseData.is_cerenia,
        isConvenia: caseData.is_convenia,
        hospitalizationReason: caseData.hospitalization_reason,
        allergicComments: caseData.allergic_comments,
        isAllergic: caseData.is_allergic,
        foodType: caseData.food_type,
        catheterDate: caseData.catheter_date,
        procedureDate: caseData.procedure_date,
        releaseDate: caseData.release_date,
        nextInspectionDate: caseData.next_inspection_date,
        stitchesRemovalDate: caseData.stitches_removal_date,
        doctor: caseData.doctor_name,
      };

      if (caseDailyData === null) {
        caseDailyData = [];
        for (let i = 1; i < DAILY_CASE_TABLE_COL_NUM; i += 1) {
          data["temp_hour" + i] = "";
          data["pulse_hour" + i] = "";
          data["respiration_hour" + i] = "";
          data["food_and_water_hour" + i] = "";
          data["comments_hour" + i] = "";
          data["respiration_hour" + i] = "";
          data["urine_hour" + i] = "";
          data["feces_hour" + i] = "";
          data["is_travel_hour" + i] = "";
          data["is_box_clean_hour" + i] = "";
          data["weigh_hour" + i] = "";
          data["is_puke_hour" + i] = "";
          data["puke_comments_hour" + i] = "";
        }
      }

      const unEditableCellHtml = `
      <div class="un-editable-cell">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="100" vector-effect="non-scaling-stroke" stroke="red"/>
          <line x1="0" y1="100" x2="100" y2="0" vector-effect="non-scaling-stroke" stroke="red"/>
        </svg>
      </div>
    `;

      const optionsCheckboxHtmlTemplate = `<tr>${Array.from(
        { length: 13 },
        (_, i) => {
          const hour = 13 - i;
          return `<td class="{optionType_optionId_is_required_hour${hour}}"><input type="checkbox" {optionType_optionId_hour${hour}}>{optionType_optionId_is_editable_hour${hour}}<br/>{optionType_optionId_comment_hour${hour}}</td>`;
        }
      ).join("")}<th class="row-title">optionName</th></tr>`;

      const optionsTextAreaHtmlTemplate = `<tr>${Array.from(
        { length: 13 },
        (_, i) =>
          `<td class="{optionType_optionId_is_required_hour${13 - i
          }}">{optionType_optionId_value_hour${13 - i
          }}{optionType_optionId_is_editable_hour${13 - i}}</td>`
      ).join("")}<th class="row-title">optionName</th></tr>`;

      const releaseMedicinesTemplate = `
      <div><span>medicineName</span><span>:שם תרופה</span></div>
      <div><span>doseAmount</span><span>:מינון</span></div>
    `;

      let fluidsHtml = "";
      let medicinesHtml = "";
      let foodExtrasHtml = "";
      let examinationsHtml = "";
      let proceduresHtml = "";
      let releaseMedicinesHtml = "";

      for (let i = 0; i < caseDailyData.length; i++) {
        const caseDailyDataItem = caseDailyData[i];
        const fluids = caseDailyDataItem.fluids;
        const medicines = caseDailyDataItem.medicines;
        const foodExtras = caseDailyDataItem.foodExtras;
        const procedures = caseDailyDataItem.procedures;
        const examinations = caseDailyDataItem.examinations;

        if (i === 0) {
          for (let j = 0; j < fluids.length; j++) {
            const fluid = fluids[j];
            const medicineId = fluid.value;
            const medicineName =
              "<span class='row-title-medicine-name'>" +
              fluid.text +
              "</span>" +
              " (" +
              fluid.doseAmount +
              fluid.measureUnitText +
              ") " +
              fluid.frequencyText +
              " " +
              fluid.medicineRouteText;
            fluidsHtml += optionsCheckboxHtmlTemplate
              .replace(/optionId/g, medicineId)
              .replace(/optionName/g, medicineName)
              .replace(/optionType/g, "medicine");
          }

          for (let j = 0; j < medicines.length; j++) {
            const medicine = medicines[j];
            const medicineId = medicine.value;
            const medicineName =
              "<span class='row-title-medicine-name'>" +
              medicine.text +
              "</span>" +
              " (" +
              medicine.doseAmount +
              medicine.measureUnitText +
              ") " +
              medicine.frequencyText +
              " " +
              medicine.medicineRouteText;
            medicinesHtml += optionsCheckboxHtmlTemplate
              .replace(/optionId/g, medicineId)
              .replace(/optionName/g, medicineName)
              .replace(/optionType/g, "medicine");
          }

          for (let j = 0; j < foodExtras.length; j++) {
            const foodExtra = foodExtras[j];
            const foodExtraId = foodExtra.value;
            const foodExtraName = foodExtra.text;
            foodExtrasHtml += optionsCheckboxHtmlTemplate
              .replace(/optionId/g, foodExtraId)
              .replace(/optionName/g, foodExtraName)
              .replace(/optionType/g, "foodExtra");
          }

          for (let j = 0; j < procedures.length; j++) {
            const procedure = procedures[j];
            const procedureId = procedure.value;
            const procedureName = procedure.text;
            proceduresHtml += optionsCheckboxHtmlTemplate
              .replace(/optionId/g, procedureId)
              .replace(/optionName/g, procedureName)
              .replace(/optionType/g, "procedure");
          }

          for (let j = 0; j < examinations.length; j++) {
            const examination = examinations[j];
            const examinationId = examination.value;
            const examinationName = examination.text;
            examinationsHtml += optionsTextAreaHtmlTemplate
              .replace(/optionId/g, examinationId)
              .replace(/optionName/g, examinationName)
              .replace(/optionType/g, "examination");
          }

          continue;
        }

        data["hour" + i] = parseInt(caseDailyDataItem.time.slice(0, 2)) + ":00";
        data["temp_hour" + i] = caseDailyDataItem.T;
        data["temp_is_required_hour" + i] =
          caseDailyDataItem.T_is_required ||
          (!this.isValueInRange(
            latestTempData.value,
            animalVitals.tempRangeMin,
            animalVitals.tempRangeMax
          ) &&
            latestTempData.colIndex === i &&
            caseDetailsDataIndex === latestTempData.dataDetailsIndex);
        data["temp_is_editable_hour" + i] = caseDailyDataItem.T_is_editable
          ? ""
          : unEditableCellHtml;
        data["pulse_hour" + i] = caseDailyDataItem.P;
        data["pulse_is_required_hour" + i] =
          caseDailyDataItem.T_is_required ||
          (!this.isValueInRange(
            latestPulseData.value,
            animalVitals.pulseRangeMin,
            animalVitals.pulseRangeMax
          ) &&
            latestPulseData.colIndex === i &&
            caseDetailsDataIndex === latestPulseData.dataDetailsIndex);
        data["pulse_is_editable_hour" + i] = caseDailyDataItem.P_is_editable
          ? ""
          : unEditableCellHtml;
        data["respiration_hour" + i] = caseDailyDataItem.R;
        data["respiration_is_required_hour" + i] =
          caseDailyDataItem.T_is_required ||
          (!this.isValueInRange(
            latestRespirationData.value,
            animalVitals.respirationRangeMin,
            animalVitals.respirationRangeMax
          ) &&
            latestRespirationData.colIndex === i &&
            caseDetailsDataIndex === latestRespirationData.dataDetailsIndex);
        data["respiration_is_editable_hour" + i] =
          caseDailyDataItem.R_is_editable ? "" : unEditableCellHtml;
        data["food_and_water_hour" + i] = caseDailyDataItem.foodAndWater;
        data["food_and_water_is_required_hour" + i] =
          caseDailyDataItem.foodAndWater_is_required;
        data["food_and_water_is_editable_hour" + i] =
          caseDailyDataItem.foodAndWater_is_editable ? "" : unEditableCellHtml;
        data["comments_hour" + i] = caseDailyDataItem.comments;
        data["comments_is_required_hour" + i] =
          caseDailyDataItem.comments_is_required;
        data["comments_is_editable_hour" + i] =
          caseDailyDataItem.comments_is_editable ? "" : unEditableCellHtml;
        data["urine_hour" + i] = caseDailyDataItem.urineComments
          ? caseDailyDataItem.urineTypeText +
          ", " +
          caseDailyDataItem.urineComments
          : caseDailyDataItem.urineTypeText;
        data["urine_is_required_hour" + i] =
          caseDailyDataItem.urine_is_required;
        data["urine_is_editable_hour" + i] = caseDailyDataItem.urine_is_editable
          ? ""
          : unEditableCellHtml;
        data["feces_hour" + i] = caseDailyDataItem.fecesComments
          ? caseDailyDataItem.fecesTypeText +
          ", " +
          caseDailyDataItem.fecesComments
          : caseDailyDataItem.fecesTypeText;
        data["feces_is_required_hour" + i] =
          caseDailyDataItem.feces_is_required;
        data["feces_is_editable_hour" + i] = caseDailyDataItem.feces_is_editable
          ? ""
          : unEditableCellHtml;
        data["is_travel_hour" + i] = caseDailyDataItem.isTravel;
        data["is_travel_is_required_hour" + i] =
          caseDailyDataItem.isTravel_is_required;
        data["is_travel_is_editable_hour" + i] =
          caseDailyDataItem.isTravel_is_editable ? "" : unEditableCellHtml;
        data["is_box_clean_hour" + i] = caseDailyDataItem.isBoxClean;
        data["is_box_clean_is_required_hour" + i] =
          caseDailyDataItem.isBoxClean_is_required;
        data["is_box_clean_is_editable_hour" + i] =
          caseDailyDataItem.isBoxClean_is_editable ? "" : unEditableCellHtml;
        data["is_release_hour" + i] = caseDailyDataItem.isRelease;
        data["is_release_is_required_hour" + i] =
          caseDailyDataItem.isRelease_is_required;
        data["is_release_is_editable_hour" + i] =
          caseDailyDataItem.isRelease_is_editable ? "" : unEditableCellHtml;
        data["weigh_hour" + i] = caseDailyDataItem.weigh;
        data["weigh_is_required_hour" + i] =
          caseDailyDataItem.weigh_is_required;
        data["weigh_is_editable_hour" + i] = caseDailyDataItem.weigh_is_editable
          ? ""
          : unEditableCellHtml;
        data["is_puke_hour" + i] = caseDailyDataItem.isPuke;
        data["puke_comments_hour" + i] = caseDailyDataItem.pukeComments
          ? caseDailyDataItem.pukeComments
          : "";
        data["puke_is_required_hour" + i] = caseDailyDataItem.puke_is_required;
        data["puke_is_editable_hour" + i] = caseDailyDataItem.puke_is_editable
          ? ""
          : unEditableCellHtml;
        data["owner_update_hour" + i] = caseDailyDataItem.ownerUpdate;
        data["owner_update_is_required_hour" + i] =
          caseDailyDataItem.ownerUpdate_is_required;
        data["owner_update_is_editable_hour" + i] =
          caseDailyDataItem.ownerUpdate_is_editable ? "" : unEditableCellHtml;

        for (let key in fluids) {
          fluidsHtml = fluidsHtml
            .replace(
              new RegExp(`{medicine_${key}_hour${i}}`, "g"),
              fluids[key].isGiven ? "checked" : ""
            )
            .replace(
              new RegExp(`{medicine_${key}_is_required_hour${i}}`, "g"),
              fluids[key].isRequired ? "required-cell" : ""
            )
            .replace(
              new RegExp(`{medicine_${key}_is_editable_hour${i}}`, "g"),
              fluids[key].isEditable ? "" : unEditableCellHtml
            )
            .replace(
              new RegExp(`{medicine_${key}_comment_hour${i}}`, "g"),
              fluids[key].comment ? fluids[key].comment : ""
            );
        }

        for (let key in medicines) {
          medicinesHtml = medicinesHtml
            .replace(
              new RegExp(`{medicine_${key}_hour${i}}`, "g"),
              medicines[key].isGiven ? "checked" : ""
            )
            .replace(
              new RegExp(`{medicine_${key}_is_required_hour${i}}`, "g"),
              medicines[key].isRequired ? "required-cell" : ""
            )
            .replace(
              new RegExp(`{medicine_${key}_is_editable_hour${i}}`, "g"),
              medicines[key].isEditable ? "" : unEditableCellHtml
            )
            .replace(
              new RegExp(`{medicine_${key}_comment_hour${i}}`, "g"),
              medicines[key].comment ? medicines[key].comment : ""
            );
        }

        for (let key in foodExtras) {
          foodExtrasHtml = foodExtrasHtml
            .replace(
              new RegExp(`{foodExtra_${key}_hour${i}}`, "g"),
              foodExtras[key].isGiven ? "checked" : ""
            )
            .replace(
              new RegExp(`{foodExtra_${key}_is_required_hour${i}}`, "g"),
              foodExtras[key].isRequired ? "required-cell" : ""
            )
            .replace(
              new RegExp(`{foodExtra_${key}_is_editable_hour${i}}`, "g"),
              foodExtras[key].isEditable ? "" : unEditableCellHtml
            )
            .replace(
              new RegExp(`{foodExtra_${key}_comment_hour${i}}`, "g"),
              ""
            );
        }

        for (let key in procedures) {
          proceduresHtml = proceduresHtml
            .replace(
              new RegExp(`{procedure_${key}_hour${i}}`, "g"),
              procedures[key].isGiven ? "checked" : ""
            )
            .replace(
              new RegExp(`{procedure_${key}_is_required_hour${i}}`, "g"),
              procedures[key].isRequired ? "required-cell" : ""
            )
            .replace(
              new RegExp(`{procedure_${key}_is_editable_hour${i}}`, "g"),
              procedures[key].isEditable ? "" : unEditableCellHtml
            )
            .replace(
              new RegExp(`{procedure_${key}_comment_hour${i}}`, "g"),
              procedures[key].comment ? procedures[key].comment : ""
            );
        }

        for (let key in examinations) {
          examinationsHtml = examinationsHtml
            .replace(
              new RegExp(`{examination_${key}_value_hour${i}}`, "g"),
              examinations[key].value ? examinations[key].value : ""
            )
            .replace(
              new RegExp(`{examination_${key}_is_required_hour${i}}`, "g"),
              examinations[key].isRequired ? "required-cell" : ""
            )
            .replace(
              new RegExp(`{examination_${key}_is_editable_hour${i}}`, "g"),
              examinations[key].isEditable ? "" : unEditableCellHtml
            );
        }
      }

      // Adding release medicines
      const releaseMedicines = await queryRunner.query(
        sqlQueries.getReleaseMedicinesForExport,
        [caseId]
      );

      for (let i = 0; i < releaseMedicines.length; i++) {
        const releaseMedicine = releaseMedicines[i];
        const releaseMedicineName = releaseMedicine.medicine_name;
        const doseAmount =
          releaseMedicine.dose_amount +
          releaseMedicine.measure_unit_text +
          " " +
          releaseMedicine.frequency_text +
          " " +
          releaseMedicine.medicine_route_text;
        releaseMedicinesHtml += releaseMedicinesTemplate
          .replace(/medicineName/g, releaseMedicineName)
          .replace(/doseAmount/g, doseAmount);
      }

      data["fluids"] = fluidsHtml;
      data["medicines"] = medicinesHtml;
      data["foodExtras"] = foodExtrasHtml;
      data["procedures"] = proceduresHtml;
      data["examinations"] = examinationsHtml;
      data["releaseMedicines"] =
        releaseMedicinesHtml === "" ? " - " : releaseMedicinesHtml;

      return await createPdf(
        "CaseDetailsTemplate.hbs",
        data,
        `patientCase_${caseId}`
      );
    } catch (err) {
      logger.error(`${err}`);
      throw err;
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async uploadDocuments(
    caseId: string,
    patientDocumentTypeId: number,
    { userId }: TokenUser,
    file: Express.Multer.File
  ) {
    const patientCase = await this.CaseService.getCaseById(caseId);
    if (!patientCase) throw new Error(caseId + "לא נמצא תיק מספר ");

    const patientDocumentType =
      await this.patientDocumentTypeRepository.findOneBy({
        id: patientDocumentTypeId,
      });
    if (!patientDocumentType)
      throw new Error(patientDocumentTypeId + "לא נמצא סוג קובץ מספר ");

    const newDocument = new PatientDocument();
    newDocument.caseId = patientCase;
    newDocument.createdAt = new Date();
    newDocument.createdBy = { id: parseInt(userId) } as User;
    newDocument.patientDocumentType = {
      id: patientDocumentTypeId,
    } as PatientDocumentType;
    let imageUrl = undefined;
    if (file) imageUrl = await uploadImage(file);
    if (!imageUrl) throw new Error("שגיאת מערכת בשמירת התמונה");
    newDocument.documentName = imageUrl;

    await this.patientDocumentRepository.save(newDocument);
  }

  async getDocuments(caseId: string) {
    const patientCase = await this.CaseService.getCaseById(caseId);
    if (!patientCase) throw new Error(caseId + "לא נמצא תיק מספר ");

    const documents = await this.patientDocumentRepository.find({
      where: { caseId: { id: caseId } },
      relations: ["patientDocumentType"],
      order: { createdAt: "DESC" },
    });

    return documents;
  }

  async deleteDocument(caseId: string, documentId: number) {
    const patientCase = await this.CaseService.getCaseById(caseId);
    if (!patientCase) throw new Error(caseId + "לא נמצא תיק מספר ");

    const document = await this.patientDocumentRepository.findOneBy({
      id: documentId,
    });
    if (!document) throw new Error(documentId + "לא נמצא קובץ מספר ");

    // Delete from DB
    await this.patientDocumentRepository.remove(document);

    // Delete from server
    try {
      deleteImage(document.documentName);
    } catch (err) {
      logger.error(`Error deleting the file: ${err}`);
    }
  }

  async getChartsData(caseId: string) {
    const patientCase = await this.CaseService.getCaseById(caseId);
    if (!patientCase) throw new Error(caseId + "לא נמצא תיק מספר ");

    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      let temperatureData = await queryRunner.query(
        sqlQueries.getChartsTemperatureData,
        [caseId]
      );
      let pulseData = await queryRunner.query(sqlQueries.getChartsPulseData, [
        caseId,
      ]);
      let respirationData = await queryRunner.query(
        sqlQueries.getChartsRespirationData,
        [caseId]
      );
      let weightData = await queryRunner.query(sqlQueries.getChartsWeightData, [
        caseId,
      ]);

      return {
        temperature: temperatureData,
        pulse: pulseData,
        respiration: respirationData,
        weight: weightData,
      };
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async archivePatient(caseId: string, shouldArchive: boolean) {
    const patientCase = await this.CaseService.getCaseById(caseId);
    if (!patientCase) throw new Error(caseId + "לא נמצא תיק מספר ");

    patientCase.isArchived = shouldArchive;
    await this.CaseService.saveCase(patientCase);
  }

  async getDailyPlan() {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      const patientsData = await queryRunner.query(
        sqlQueries.getDailyPlanDetails
      );

      // Getting examinations, owner update and release medicines data for each patient
      for (let i = 0; i < patientsData.length; i++) {
        const patient = patientsData[i];
        const caseId = patient.case_id;

        // Release medicines
        const patientReleaseMedicines = await queryRunner.query(
          sqlQueries.getDailyPlanDetailsReleaseMedicines,
          [caseId]
        );
        patient.releaseMedicines = patientReleaseMedicines;

        // Case procedures
        const caseProcedures = await queryRunner.query(
          sqlQueries.getDailyPlanDetailsCaseProcedures,
          [caseId]
        );
        patient.caseProcedures = caseProcedures;

        // Case examinations
        const caseExaminations = await queryRunner.query(
          sqlQueries.getDailyPlanDetailsCaseExaminations,
          [caseId]
        );
        patient.caseExaminations = caseExaminations;

        // Owner update
        const ownerUpdate = await queryRunner.query(
          sqlQueries.getDailyPlanDetailsOwnerUpdate,
          [caseId]
        );
        patient.ownerUpdate = ownerUpdate;
      }

      return patientsData;
    } catch (err) {
      logger.error(`${err}`);
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async updateDailyPlan(details: { [caseId: string]: { comment: string } }) {
    try {
      for (let caseId in details) {
        const patientCase = await this.CaseService.getCaseById(caseId);
        if (!patientCase) throw new Error(caseId + "לא נמצא תיק מספר ");

        patientCase.dailyPlanComments = details[caseId].comment;
        patientCase.dailyPlanCommentsCreatedAt = new Date();
        await this.CaseService.saveCase(patientCase);
      }
    } catch (err) {
      logger.error(`${err}`);
      throw new Error("שמירת הפרטים נכשלה");
    }
  }
}

export default PatientService;
