import { AnimalType } from "../models/AnimalType";
import { AppDataSource, getQueryRunner } from "../../config/typeORM";
import { Not, Repository } from "typeorm";
import { RaceType } from "../models/RaceType";
import { AnimalColor } from "../models/AnimalColor";
import { FecesType } from "../models/FecesType";
import { FoodType } from "../models/FoodType";
import { GenderType } from "../models/GenderType";
import { UrineType } from "../models/UrineType";
import { User } from "../models/User";
import { UserRole } from "../models/UserRole";
import logger from "../../api/utils/Logger";
import { sqlQueries } from "../../config/SqlQueries";
import { Medicine } from "../models/Medicine";
import { MedicineCategory } from "../models/MedicineCategory";
import { DosageFrequency } from "../models/DosageFrequency";
import { RouteOfAdministration } from "../models/RouteOfAdministration";
import { MeasureUnitTypes } from "../models/MeasureUnitTypes";
import { SystemTypes } from "../enums/SystemTypes";
import { createObjectCsvStringifier } from "csv-writer";
import { InsuranceType } from "../models/InsuranceType";
import { FoodExtraType } from "../models/FoodExtraType";
import { ExaminationType } from "../models/ExaminationType";
import { ProcedureType } from "../models/ProcedureType";
import { AnimalVitals } from "../models/AnimalVitals";

const KEY_CONSTRAINT_ERROR_CODE = "23503";
const KEY_CONSTRAINT_ERROR_MESSAGE =
  "יש ישויות אחרות התלויות בישות זאת, ניתן למחוק אותה רק לאחר עדכון/מחיקת הישויות התלויות";
const SYSTEM_ERROR_MESSAGE = "הפעולה נכשלה, שגיאת מערכת";

interface AnimalVitalsDTO {
  tempRangeMax: number | undefined;
  tempRangeMin: number | undefined;
  pulseRangeMax: number | undefined;
  pulseRangeMin: number | undefined;
  respirationRangeMax: number | undefined;
  respirationRangeMin: number | undefined;
}

class AdminService {
  private animalTypeRepository: Repository<AnimalType> =
    AppDataSource.getRepository(AnimalType);
  private raceTypeRepository: Repository<RaceType> =
    AppDataSource.getRepository(RaceType);
  private animalColorRepository: Repository<AnimalColor> =
    AppDataSource.getRepository(AnimalColor);
  private facesTypeRepository: Repository<FecesType> =
    AppDataSource.getRepository(FecesType);
  private foodTypeRepository: Repository<FoodType> =
    AppDataSource.getRepository(FoodType);
  private genderTypeRepository: Repository<GenderType> =
    AppDataSource.getRepository(GenderType);
  private urineTypeRepository: Repository<UrineType> =
    AppDataSource.getRepository(UrineType);
  private userRepository: Repository<User> = AppDataSource.getRepository(User);
  private userRoleRepository: Repository<UserRole> =
    AppDataSource.getRepository(UserRole);
  private medicineRepository: Repository<Medicine> =
    AppDataSource.getRepository(Medicine);
  private medicineCategoryRepository: Repository<MedicineCategory> =
    AppDataSource.getRepository(MedicineCategory);
  private dosageFrequencyRepository: Repository<DosageFrequency> =
    AppDataSource.getRepository(DosageFrequency);
  private routesForAdministrationRepository: Repository<RouteOfAdministration> =
    AppDataSource.getRepository(RouteOfAdministration);
  private measureUnitTypesRepository: Repository<MeasureUnitTypes> =
    AppDataSource.getRepository(MeasureUnitTypes);
  private insuranceTypeRepository: Repository<InsuranceType> =
    AppDataSource.getRepository(InsuranceType);
  private foodExtrasTypeRepository: Repository<FoodExtraType> =
    AppDataSource.getRepository(FoodExtraType);
  private examinationTypeRepository: Repository<ExaminationType> =
    AppDataSource.getRepository(ExaminationType);
  private proceduresTypeRepository: Repository<ProcedureType> =
    AppDataSource.getRepository(ProcedureType);
  private animalVitalsRepository: Repository<AnimalVitals> =
    AppDataSource.getRepository(AnimalVitals);

  constructor() {}

  async getAllAnimalTypes(): Promise<AnimalType[]> {
    return await this.animalTypeRepository.find();
  }

  async newAnimalType(name: string): Promise<AnimalType> {
    const existingAnimalType = await this.animalTypeRepository.findOneBy({
      name,
    });

    if (existingAnimalType) throw new Error("סוג חיה עם אותו שם כבר קיים");

    const animalType = new AnimalType();
    animalType.name = name;
    animalType.createdAt = new Date();
    await this.animalTypeRepository.save(animalType);

    logger.info(`New animal type created: ${name}`);
    return animalType;
  }

  async newUserRole(name: string): Promise<UserRole> {
    const existingUserRole = await this.userRoleRepository.findOneBy({
      name,
    });
    if (existingUserRole) throw new Error("סוג תפקיד עם אותו שם כבר קיים");

    const userRole = new UserRole();
    userRole.name = name;
    userRole.createdAt = new Date();

    await this.userRoleRepository.save(userRole);

    logger.info(`New user role created: ${name}`);
    return userRole;
  }

  async deleteUserRole(id: number): Promise<void> {
    const existingUserRole = await this.userRoleRepository.findOneBy({
      id,
    });

    if (!existingUserRole)
      throw new Error("סוג תפקיד עם מספר זהות זה אינו קיים");

    try {
      const name = existingUserRole.name;
      await this.userRoleRepository.remove(existingUserRole);
      logger.info(`User role deleted: ${name}`);
    } catch (err: any) {
      this.handleDeleteError(err);
    }
  }

  async editAnimalType(id: number, name: string): Promise<AnimalType> {
    const existingAnimalType = await this.animalTypeRepository.findOne({
      where: { id: Not(id), name: name },
    });

    if (existingAnimalType) throw new Error("סוג חיה עם אותו שם כבר קיים");

    const editedAnimalType = await this.animalTypeRepository.findOneBy({
      id,
    });

    if (!editedAnimalType) throw new Error("סוג חיה עם מספר זהות זה אינו קיים");

    editedAnimalType.name = name;
    await this.animalTypeRepository.save(editedAnimalType);

    logger.info(`Animal type edited: ${name}`);
    return editedAnimalType;
  }

  async deleteAnimalType(id: number): Promise<void> {
    const existingAnimalType = await this.animalTypeRepository.findOneBy({
      id,
    });

    if (!existingAnimalType)
      throw new Error("סוג חיה עם מספר זהות זה אינו קיים");

    try {
      await this.animalTypeRepository.remove(existingAnimalType);
      logger.info(`Animal type deleted: ${existingAnimalType.name}`);
    } catch (err: any) {
      this.handleDeleteError(err);
    }
  }

  async getAllRaceTypes(): Promise<RaceType[]> {
    return await this.raceTypeRepository.find();
  }

  async getRaceTypesByAnimalId(animalId: number): Promise<RaceType[]> {
    return await this.raceTypeRepository.find({
      where: { animalType: { id: animalId } },
    });
  }

  async newRaceType(name: string, animalTypeId: number): Promise<RaceType> {
    const existingRaceType = await this.raceTypeRepository.findOneBy({
      name,
    });

    if (existingRaceType) throw new Error("סוג גזע עם אותו שם כבר קיים");

    const animalType = await this.animalTypeRepository.findOneBy({
      id: animalTypeId,
    });

    if (!animalType) throw new Error("סוג חיה עם מספר זהות זה אינו קיים");

    const raceType = new RaceType();
    raceType.name = name;
    raceType.createdAt = new Date();
    raceType.animalType = {
      id: animalTypeId,
    } as AnimalType;
    await this.raceTypeRepository.save(raceType);

    logger.info(`New animal race created: ${name}`);
    return raceType;
  }

  async editRaceType(
    id: number,
    name: string,
    animalTypeId: number
  ): Promise<RaceType> {
    const existingRaceType = await this.raceTypeRepository.findOne({
      where: { id: Not(id), name: name },
    });

    if (existingRaceType) throw new Error("סוג גזע עם אותו שם כבר קיים");

    const editedRaceType = await this.raceTypeRepository.findOneBy({
      id,
    });

    if (!editedRaceType) throw new Error("סוג גזע עם מספר זהות זה אינו קיים");

    const animalType = await this.animalTypeRepository.findOneBy({
      id: animalTypeId,
    });

    if (!animalType) throw new Error("סוג חיה עם מספר זהות זה אינו קיים");

    editedRaceType.name = name;
    editedRaceType.animalType = {
      id: animalTypeId,
    } as AnimalType;
    await this.raceTypeRepository.save(editedRaceType);

    logger.info(`Animal race edited: ${name}`);
    return editedRaceType;
  }

  async deleteRaceType(id: number): Promise<void> {
    const existingRaceType = await this.raceTypeRepository.findOneBy({
      id,
    });

    if (!existingRaceType) throw new Error("סוג גזע עם מספר זהות זה אינו קיים");

    try {
      await this.raceTypeRepository.remove(existingRaceType);
      logger.info(`Animal race deleted: ${existingRaceType.name}`);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllAnimalColors(): Promise<AnimalColor[]> {
    return await this.animalColorRepository.find();
  }

  async newAnimalColor(name: string): Promise<AnimalColor> {
    const existingAnimalColor = await this.animalColorRepository.findOneBy({
      name,
    });

    if (existingAnimalColor) throw new Error("צבע חיה עם אותו שם כבר קיים");

    const animalColor = new AnimalColor();
    animalColor.name = name;
    animalColor.createdAt = new Date();
    await this.animalColorRepository.save(animalColor);

    logger.info(`New animal color created: ${name}`);
    return animalColor;
  }

  async editAnimalColor(id: number, name: string): Promise<AnimalColor> {
    const existingAnimalColor = await this.animalColorRepository.findOne({
      where: { id: Not(id), name: name },
    });

    if (existingAnimalColor) throw new Error("צבע חיה עם אותו שם כבר קיים");

    const editedAnimalColor = await this.animalColorRepository.findOneBy({
      id,
    });

    if (!editedAnimalColor)
      throw new Error("צבע חיה עם מספר זהות זה אינו קיים");

    editedAnimalColor.name = name;
    await this.animalColorRepository.save(editedAnimalColor);

    logger.info(`Animal color edited: ${name}`);
    return editedAnimalColor;
  }

  async deleteAnimalColor(id: number): Promise<void> {
    const existingAnimalColor = await this.animalColorRepository.findOneBy({
      id,
    });

    if (!existingAnimalColor)
      throw new Error("צבע חיה עם מספר זהות זה אינו קיים");

    try {
      await this.animalColorRepository.remove(existingAnimalColor);
      logger.info(`Animal color deleted: ${existingAnimalColor.name}`);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAnimalVitalsByAnimalId(animalId: number): Promise<AnimalVitalsDTO> {
    const animalVitals = await this.animalVitalsRepository.find({
      where: { animalId: { id: animalId } as AnimalType },
    });

    let animalVitalsDTO = {
      tempRangeMax: undefined as number | undefined,
      tempRangeMin: undefined as number | undefined,
      pulseRangeMax: undefined as number | undefined,
      pulseRangeMin: undefined as number | undefined,
      respirationRangeMax: undefined as number | undefined,
      respirationRangeMin: undefined as number | undefined,
    };

    for (const animalVital of animalVitals) {
      if (animalVital.vitalsType === "T") {
        animalVitalsDTO.tempRangeMax = animalVital.rangeMax;
        animalVitalsDTO.tempRangeMin = animalVital.rangeMin;
      } else if (animalVital.vitalsType === "P") {
        animalVitalsDTO.pulseRangeMax = animalVital.rangeMax;
        animalVitalsDTO.pulseRangeMin = animalVital.rangeMin;
      } else if (animalVital.vitalsType === "R") {
        animalVitalsDTO.respirationRangeMax = animalVital.rangeMax;
        animalVitalsDTO.respirationRangeMin = animalVital.rangeMin;
      }
    }

    return animalVitalsDTO;
  }

  async newAnimalVitals(
    animalId: number,
    type: "T" | "P" | "R",
    rangeMin: number | undefined,
    rangeMax: number | undefined
  ): Promise<AnimalVitals> {
    const animal = await this.animalTypeRepository.findOneBy({ id: animalId });
    if (!animal) throw new Error("חיה עם מספר זהות זה אינה קיימת");

    const existingAnimalVitals = await this.animalVitalsRepository.findOneBy({
      animalId: { id: animalId } as AnimalType,
      vitalsType: type,
    });
    if (existingAnimalVitals) throw new Error("סוג התראה עבור חיה זו כבר קיים");

    if (rangeMax && rangeMin && rangeMax < rangeMin)
      throw new Error("טווח מינימום חייב להיות קטן מטווח מקסימום");

    const newAnimalVitalsAlert = new AnimalVitals();
    newAnimalVitalsAlert.animalId = animal;
    newAnimalVitalsAlert.vitalsType = type;
    newAnimalVitalsAlert.rangeMin = rangeMin;
    newAnimalVitalsAlert.rangeMax = rangeMax;

    await this.animalVitalsRepository.save(newAnimalVitalsAlert);
    return newAnimalVitalsAlert;
  }

  async editAnimalVitals(
    id: number,
    rangeMin: number,
    rangeMax: number
  ): Promise<AnimalVitals> {
    const existingAnimalVitals = await this.animalVitalsRepository.findOneBy({
      id,
    });

    if (!existingAnimalVitals)
      throw new Error("סוג התראה עם מספר זהות זה אינה קיימת");

    if (rangeMax && rangeMin && rangeMax < rangeMin)
      throw new Error("טווח מינימום חייב להיות קטן מטווח מקסימום");

    existingAnimalVitals.rangeMin = rangeMin;
    existingAnimalVitals.rangeMax = rangeMax;
    await this.animalVitalsRepository.save(existingAnimalVitals);
    logger.info(`Animal vitals alert edited: ${existingAnimalVitals.id}`);
    return existingAnimalVitals;
  }

  async deleteAnimalVitals(id: number): Promise<void> {
    const existingAnimalVitals = await this.animalVitalsRepository.findOneBy({
      id,
    });
    if (!existingAnimalVitals)
      throw new Error("סוג התראה עם מספר זהות זה אינה קיימת");

    try {
      await this.animalVitalsRepository.remove(existingAnimalVitals);
      logger.info(`Animal vitals alert deleted: ${id}`);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllFecesTypes(): Promise<FecesType[]> {
    return await this.facesTypeRepository.find();
  }

  async newFecesType(name: string): Promise<FecesType> {
    const existingFecesType = await this.facesTypeRepository.findOneBy({
      name,
    });

    if (existingFecesType) throw new Error("סוג צואה עם אותו שם כבר קיים");

    const fecesType = new FecesType();
    fecesType.name = name;
    fecesType.createdAt = new Date();
    await this.facesTypeRepository.save(fecesType);

    logger.info(`New feces type created: ${name}`);
    return fecesType;
  }

  async editFecesType(id: number, name: string): Promise<FecesType> {
    const existingFecesType = await this.facesTypeRepository.findOne({
      where: { id: Not(id), name: name },
    });

    if (existingFecesType) throw new Error("סוג צואה עם אותו שם כבר קיים");

    const editedFecesType = await this.facesTypeRepository.findOneBy({
      id,
    });

    if (!editedFecesType) throw new Error("סוג צואה עם מספר זהות זה אינו קיים");

    editedFecesType.name = name;
    await this.facesTypeRepository.save(editedFecesType);

    logger.info(`Feces type edited: ${name}`);
    return editedFecesType;
  }

  async deleteFecesType(id: number): Promise<void> {
    const existingFecesType = await this.facesTypeRepository.findOneBy({
      id,
    });

    if (!existingFecesType)
      throw new Error("סוג צואה עם מספר זהות זה אינו קיים");

    try {
      await this.facesTypeRepository.remove(existingFecesType);
      logger.info(`Feces type deleted: ${existingFecesType.name}`);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllFoodTypes(): Promise<FoodType[]> {
    return await this.foodTypeRepository.find();
  }

  async newFoodType(name: string): Promise<FoodType> {
    const existingFoodType = await this.foodTypeRepository.findOneBy({
      name,
    });

    if (existingFoodType) throw new Error("סוג אוכל עם אותו שם כבר קיים");

    const foodType = new FoodType();
    foodType.name = name;
    foodType.createdAt = new Date();
    await this.foodTypeRepository.save(foodType);

    logger.info(`New food type created: ${name}`);
    return foodType;
  }

  async editFoodType(id: number, name: string): Promise<FoodType> {
    const existingFoodType = await this.foodTypeRepository.findOne({
      where: { id: Not(id), name: name },
    });

    if (existingFoodType) throw new Error("סוג אוכל עם אותו שם כבר קיים");

    const editedFoodType = await this.foodTypeRepository.findOneBy({
      id,
    });

    if (!editedFoodType) throw new Error("סוג אוכל עם מספר זהות זה אינו קיים");

    editedFoodType.name = name;
    await this.foodTypeRepository.save(editedFoodType);

    logger.info(`Food type edited: ${name}`);
    return editedFoodType;
  }

  async deleteFoodType(id: number): Promise<void> {
    const existingFoodType = await this.foodTypeRepository.findOneBy({
      id,
    });

    if (!existingFoodType)
      throw new Error("סוג אוכל עם מספר זהות זה אינו קיים");

    try {
      await this.foodTypeRepository.remove(existingFoodType);
      logger.info(`Food type deleted: ${existingFoodType.name}`);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllGenderTypes(): Promise<GenderType[]> {
    return await this.genderTypeRepository.find();
  }

  async newGenderType(name: string): Promise<GenderType> {
    const existingGenderType = await this.genderTypeRepository.findOneBy({
      name,
    });

    if (existingGenderType) throw new Error("מין עם אותו שם כבר קיים");

    const genderType = new GenderType();
    genderType.name = name;
    genderType.createdAt = new Date();
    await this.genderTypeRepository.save(genderType);

    logger.info(`New gender type created: ${name}`);
    return genderType;
  }

  async editGenderType(id: number, name: string): Promise<GenderType> {
    const existingGenderType = await this.genderTypeRepository.findOne({
      where: { id: Not(id), name: name },
    });

    if (existingGenderType) throw new Error("מין עם אותו שם כבר קיים");

    const editedGenderType = await this.genderTypeRepository.findOneBy({
      id,
    });

    if (!editedGenderType) throw new Error("מין עם מספר זהות זה אינו קיים");

    editedGenderType.name = name;
    await this.genderTypeRepository.save(editedGenderType);

    logger.info(`Gender type edited: ${name}`);
    return editedGenderType;
  }

  async deleteGenderType(id: number): Promise<void> {
    const existingGenderType = await this.genderTypeRepository.findOneBy({
      id,
    });

    if (!existingGenderType) throw new Error("מין עם מספר זהות זה אינו קיים");

    try {
      await this.genderTypeRepository.remove(existingGenderType);
      logger.info(`Gender type deleted: ${existingGenderType.name}`);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllUrineTypes(): Promise<UrineType[]> {
    return await this.urineTypeRepository.find();
  }

  async newUrineType(name: string): Promise<UrineType> {
    const existingUrineType = await this.urineTypeRepository.findOneBy({
      name,
    });

    if (existingUrineType) throw new Error("סוג שתן עם אותו שם כבר קיים");

    const urineType = new UrineType();
    urineType.name = name;
    urineType.createdAt = new Date();
    await this.urineTypeRepository.save(urineType);

    logger.info(`New urine type created: ${name}`);
    return urineType;
  }

  async editUrineType(id: number, name: string): Promise<UrineType> {
    const existingUrineType = await this.urineTypeRepository.findOne({
      where: { id: Not(id), name: name },
    });

    if (existingUrineType) throw new Error("סוג שתן עם אותו שם כבר קיים");

    const editedUrineType = await this.urineTypeRepository.findOneBy({
      id,
    });

    if (!editedUrineType) throw new Error("סוג שתן עם מספר זהות זה אינו קיים");

    editedUrineType.name = name;
    await this.urineTypeRepository.save(editedUrineType);

    logger.info(`Urine type edited: ${name}`);
    return editedUrineType;
  }

  async deleteUrineType(id: number): Promise<void> {
    const existingUrineType = await this.urineTypeRepository.findOneBy({
      id,
    });

    if (!existingUrineType)
      throw new Error("סוג שתן עם מספר זהות זה אינו קיים");

    try {
      await this.urineTypeRepository.remove(existingUrineType);
      logger.info(`Urine type deleted: ${existingUrineType.name}`);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async editUser(
    id: number,
    username: string,
    email: string,
    firstName: string,
    lastName: string,
    roleId: number
  ): Promise<{
    firstName: string;
    lastName: string;
    roleName: string;
  }> {
    const existingUser = await this.userRepository.findOneBy({
      id,
      isDeleted: false,
    });
    if (!existingUser) throw new Error("משתמש לא קיים");

    const userRole = await this.userRoleRepository.findOneBy({
      id: roleId,
    });
    if (!userRole) throw new Error("תפקיד לא קיים");

    const userWithEmail = await this.userRepository.findOne({
      where: { id: Not(id), email: email, isDeleted: false },
    });
    if (userWithEmail) throw new Error("האימייל כבר קיים במערכת");

    const userWithUsername = await this.userRepository.findOne({
      where: { id: Not(id), username: username, isDeleted: false },
    });
    if (userWithUsername) throw new Error("שם משתמש כבר קיים במערכת");

    existingUser.userRole = userRole;
    existingUser.username = username;
    existingUser.email = email;
    existingUser.firstName = firstName;
    existingUser.lastName = lastName;
    await this.userRepository.save(existingUser);

    logger.info(`User edited: ${username}`);
    return {
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      roleName: userRole.name,
    };
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findOneBy({
      id,
      isDeleted: false,
    });
    if (!user) throw new Error("משתמש לא קיים");

    try {
      user.isDeleted = true;
      await this.userRepository.save(user);
      logger.info(`User deleted: ${user.username}`);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllDoctors(): Promise<{ id: number; name: string }[]> {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      const doctors = await queryRunner.query(sqlQueries.getAllDoctors);
      return doctors;
    } catch (err) {
      logger.error(`${err}`);
      throw new Error("שגיאת מערכת בשליפת הרופאים");
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getAllNurses(): Promise<{ id: number; name: string }[]> {
    let queryRunner;

    try {
      queryRunner = getQueryRunner();
      await queryRunner.connect();

      const nurses = await queryRunner.query(sqlQueries.getAllNurses);
      return nurses;
    } catch (err) {
      logger.error(`${err}`);
      throw new Error("שגיאת מערכת בשליפת האחיות");
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  async getAllMedicines(): Promise<Medicine[]> {
    return await this.medicineRepository.find();
  }

  async getAllMedicinesByCategoryType(id: number): Promise<Medicine[]> {
    return await this.medicineRepository.find({
      where: { category: { id } },
    });
  }

  async newMedicineCategory(name: string): Promise<MedicineCategory> {
    const existingMedicineCategory =
      await this.medicineCategoryRepository.findOneBy({
        name,
      });
    if (existingMedicineCategory)
      throw new Error("קטגוריית תרופות עם שם זה כבר קיימת");

    const medicineCategory = new MedicineCategory();
    medicineCategory.name = name;
    medicineCategory.createdAt = new Date();

    await this.medicineCategoryRepository.save(medicineCategory);

    logger.info(`New medicine category created: ${name}`);
    return medicineCategory;
  }

  async newUnitType(name: string): Promise<MeasureUnitTypes> {
    const existingUnitType = await this.measureUnitTypesRepository.findOneBy({
      name,
    });
    if (existingUnitType) throw new Error("יחידת מידה עם שם זה כבר קיימת");

    const unitType = new MeasureUnitTypes();
    unitType.name = name;
    unitType.createdAt = new Date();

    await this.measureUnitTypesRepository.save(unitType);

    logger.info(`New unit type created: ${name}`);
    return unitType;
  }

  async newMedicine(
    name: string,
    rangeMax: number | undefined,
    rangeMin: number | undefined,
    totalDose: number | undefined,
    routeOfAdministrationId: number | null,
    dosageFrequencyId: number | null,
    unit: number,
    categoryId: number,
    comments: string | null
  ): Promise<Medicine> {
    const existingMedicine = await this.medicineRepository.findOneBy({
      name,
    });

    if (existingMedicine) throw new Error("תרופה עם אותו שם כבר קיימת");

    const medicineCategory = await this.medicineCategoryRepository.findOneBy({
      id: categoryId,
    });
    if (!medicineCategory) throw new Error("קטגוריה לא קיימת");

    const measureUnitTypesRepository = this.measureUnitTypesRepository;
    const measureUnitType = await measureUnitTypesRepository.findOneBy({
      id: unit,
    });
    if (!measureUnitType) throw new Error("יחידת מידה לא קיימת");

    let dosageFrequency;
    if (dosageFrequencyId) {
      dosageFrequency = await this.dosageFrequencyRepository.findOneBy({
        id: dosageFrequencyId,
      });
      if (!dosageFrequency) throw new Error("תדירות לא קיימת");
    }

    let routeOfAdministration;
    if (routeOfAdministrationId) {
      routeOfAdministration =
        await this.routesForAdministrationRepository.findOneBy({
          id: routeOfAdministrationId,
        });
      if (!routeOfAdministration) throw new Error("אופן מתן לא קיים");
    }

    if (rangeMax && rangeMin && rangeMax < rangeMin)
      throw new Error("טווח מינימום חייב להיות קטן מטווח מקסימום");

    const medicine = new Medicine();
    medicine.name = name;
    medicine.rangeMax = rangeMax;
    medicine.rangeMin = rangeMin;
    medicine.totalDose = totalDose;
    medicine.routeOfAdministration = routeOfAdministration;
    medicine.dosageFrequency = dosageFrequency;
    medicine.createdAt = new Date();
    medicine.unit = measureUnitType;
    medicine.category = medicineCategory;
    medicine.comments = comments;
    await this.medicineRepository.save(medicine);

    logger.info(`New medicine created: ${name}`);
    return medicine;
  }

  async editMedicine(
    id: number,
    name: string,
    rangeMax: number | undefined,
    rangeMin: number | undefined,
    totalDose: number | undefined,
    routeOfAdministrationId: number | null,
    dosageFrequencyId: number | null,
    unit: number,
    categoryId: number,
    comments: string | null
  ): Promise<Medicine> {
    const existingMedicine = await this.medicineRepository.findOne({
      where: { id: Not(id), name: name },
    });

    if (existingMedicine) throw new Error("תרופה עם אותו שם כבר קיימת");

    const editedMedicine = await this.medicineRepository.findOneBy({
      id,
    });

    if (!editedMedicine) throw new Error("תרופה לא קיימת");

    const medicineCategory = await this.medicineCategoryRepository.findOneBy({
      id: categoryId,
    });
    if (!medicineCategory) throw new Error("קטגוריה לא קיימת");

    const measureUnitTypesRepository = this.measureUnitTypesRepository;
    const measureUnitType = await measureUnitTypesRepository.findOneBy({
      id: unit,
    });
    if (!measureUnitType) throw new Error("יחידת מידה לא קיימת");

    let dosageFrequency;
    if (dosageFrequencyId) {
      dosageFrequency = await this.dosageFrequencyRepository.findOneBy({
        id: dosageFrequencyId,
      });
      if (!dosageFrequency) throw new Error("תדירות לא קיימת");
    }

    let routeOfAdministration;
    if (routeOfAdministrationId) {
      routeOfAdministration =
        await this.routesForAdministrationRepository.findOneBy({
          id: routeOfAdministrationId,
        });
      if (!routeOfAdministration) throw new Error("אופן מתן לא קיים");
    }

    if (rangeMax && rangeMin && rangeMax < rangeMin)
      throw new Error("טווח מינימום חייב להיות קטן מטווח מקסימום");

    editedMedicine.name = name;
    editedMedicine.rangeMax = rangeMax;
    editedMedicine.rangeMin = rangeMin;
    editedMedicine.totalDose = totalDose;
    editedMedicine.routeOfAdministration = routeOfAdministration;
    editedMedicine.dosageFrequency = dosageFrequency;
    editedMedicine.unit = measureUnitType;
    editedMedicine.category = medicineCategory;
    editedMedicine.comments = comments;

    await this.medicineRepository.save(editedMedicine);

    logger.info(`Medicine type edited: ${name}`);
    return editedMedicine;
  }

  async deleteMedicine(id: number): Promise<void> {
    const medicine = await this.medicineRepository.findOneBy({ id });
    if (!medicine) throw new Error("תרופה לא קיימת");
    try {
      await this.medicineRepository.remove(medicine);
      logger.info(`Medicine deleted: ${medicine.name}`);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllMedicineCategoryTypes(): Promise<MedicineCategory[]> {
    return await this.medicineCategoryRepository.find({
      order: {
        id: "ASC",
      },
    });
  }

  async getAllMeasureUnitTypes(): Promise<MeasureUnitTypes[]> {
    return await this.measureUnitTypesRepository.find();
  }

  async newMeasureUnitType(name: string): Promise<MeasureUnitTypes> {
    const existingMeasureUnitType =
      await this.measureUnitTypesRepository.findOneBy({ name });
    if (existingMeasureUnitType)
      throw new Error("יחידת מידה עם אותו שם כבר קיימת");

    const newMeasureUnitType = new MeasureUnitTypes();
    newMeasureUnitType.name = name;
    newMeasureUnitType.createdAt = new Date();
    await this.measureUnitTypesRepository.save(newMeasureUnitType);
    return newMeasureUnitType;
  }

  async editMeasureUnitType(
    id: number,
    name: string
  ): Promise<MeasureUnitTypes> {
    const existingMeasureUnitType =
      await this.measureUnitTypesRepository.findOneBy({ name });
    if (existingMeasureUnitType)
      throw new Error("יחידת מידה עם אותו שם כבר קיימת");

    const editedMeasureUnitType =
      await this.measureUnitTypesRepository.findOneBy({ id });
    if (!editedMeasureUnitType) throw new Error("יחידת מידה לא קיימת");
    editedMeasureUnitType.name = name;
    await this.measureUnitTypesRepository.save(editedMeasureUnitType);
    return editedMeasureUnitType;
  }

  async deleteMeasureUnitType(id: number): Promise<void> {
    const measureUnitType = await this.measureUnitTypesRepository.findOneBy({
      id,
    });
    if (!measureUnitType) throw new Error("יחידת מידה לא קיימת");
    try {
      await this.measureUnitTypesRepository.remove(measureUnitType);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllDosageFrequencyTypes(): Promise<DosageFrequency[]> {
    return await this.dosageFrequencyRepository.find();
  }

  async newDosageFrequencyType(
    name: string,
    description: string,
    descriptionPerHour: string
  ): Promise<DosageFrequency> {
    const existingDosageFrequency =
      await this.dosageFrequencyRepository.findOneBy({ name });
    if (existingDosageFrequency) throw new Error("תדירות עם אותו שם כבר קיימת");

    const newDosageFrequency = new DosageFrequency();
    newDosageFrequency.name = name;
    newDosageFrequency.description = description;
    newDosageFrequency.descriptionPerHour = descriptionPerHour;
    newDosageFrequency.createdAt = new Date();
    await this.dosageFrequencyRepository.save(newDosageFrequency);
    return newDosageFrequency;
  }

  async editDosageFrequencyType(
    id: number,
    name: string,
    description: string,
    descriptionPerHour: string
  ): Promise<DosageFrequency> {
    const existingDosageFrequency =
      await this.dosageFrequencyRepository.findOneBy({ name });
    if (existingDosageFrequency) throw new Error("תדירות עם אותו שם כבר קיימת");

    const editedDosageFrequency =
      await this.dosageFrequencyRepository.findOneBy({ id });
    if (!editedDosageFrequency) throw new Error("תדירות לא קיימת");
    editedDosageFrequency.name = name;
    editedDosageFrequency.description = description;
    editedDosageFrequency.descriptionPerHour = descriptionPerHour;
    await this.dosageFrequencyRepository.save(editedDosageFrequency);
    return editedDosageFrequency;
  }

  async deleteDosageFrequencyType(id: number): Promise<void> {
    const dosageFrequency = await this.dosageFrequencyRepository.findOneBy({
      id,
    });
    if (!dosageFrequency) throw new Error("תדירות לא קיימת");
    try {
      await this.dosageFrequencyRepository.remove(dosageFrequency);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllInsuranceTypes(): Promise<InsuranceType[]> {
    return await this.insuranceTypeRepository.find();
  }

  async newInsuranceType(name: string): Promise<InsuranceType> {
    const existingInsuranceType = await this.insuranceTypeRepository.findOneBy({
      name,
    });
    if (existingInsuranceType) throw new Error("ביטוח עם אותו שם כבר קיים");

    const newInsuranceType = new InsuranceType();
    newInsuranceType.name = name;
    newInsuranceType.createdAt = new Date();
    await this.insuranceTypeRepository.save(newInsuranceType);
    return newInsuranceType;
  }

  async editInsuranceType(id: number, name: string): Promise<InsuranceType> {
    const existingInsuranceType = await this.insuranceTypeRepository.findOneBy({
      name,
    });
    if (existingInsuranceType) throw new Error("ביטוח עם אותו שם כבר קיים");

    const editedInsuranceType = await this.insuranceTypeRepository.findOneBy({
      id,
    });
    if (!editedInsuranceType) throw new Error("ביטוח לא קיים");
    editedInsuranceType.name = name;
    await this.insuranceTypeRepository.save(editedInsuranceType);
    return editedInsuranceType;
  }

  async deleteInsuranceType(id: number): Promise<void> {
    const insuranceType = await this.insuranceTypeRepository.findOneBy({
      id,
    });
    if (!insuranceType) throw new Error("ביטוח לא קיים");
    try {
      await this.insuranceTypeRepository.remove(insuranceType);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllFoodExtrasTypes(): Promise<FoodExtraType[]> {
    return await this.foodExtrasTypeRepository.find();
  }

  async newFoodExtrasType(name: string): Promise<FoodExtraType> {
    const existingFoodExtrasType =
      await this.foodExtrasTypeRepository.findOneBy({ name });
    if (existingFoodExtrasType)
      throw new Error("סוג תוספות למזון עם אותו שם כבר קיים");

    const newFoodExtrasType = new FoodExtraType();
    newFoodExtrasType.name = name;
    newFoodExtrasType.createdAt = new Date();
    await this.foodExtrasTypeRepository.save(newFoodExtrasType);
    return newFoodExtrasType;
  }

  async editFoodExtrasType(id: number, name: string): Promise<FoodExtraType> {
    const existingFoodExtrasType =
      await this.foodExtrasTypeRepository.findOneBy({ name });
    if (existingFoodExtrasType)
      throw new Error("סוג תוספות למזון עם אותו שם כבר קיים");

    const editedFoodExtrasType = await this.foodExtrasTypeRepository.findOneBy({
      id,
    });
    if (!editedFoodExtrasType) throw new Error("סוג תוספות למזון לא קיים");
    editedFoodExtrasType.name = name;
    await this.foodExtrasTypeRepository.save(editedFoodExtrasType);
    return editedFoodExtrasType;
  }

  async deleteFoodExtrasType(id: number): Promise<void> {
    const foodExtrasType = await this.foodExtrasTypeRepository.findOneBy({
      id,
    });
    if (!foodExtrasType) throw new Error("סוג תוספות למזון לא קיים");
    try {
      await this.foodExtrasTypeRepository.remove(foodExtrasType);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllProceduresTypes(): Promise<ProcedureType[]> {
    return await this.proceduresTypeRepository.find();
  }

  async newProcedureType(name: string): Promise<ProcedureType> {
    const existingProcedure = await this.proceduresTypeRepository.findOneBy({
      name,
    });
    if (existingProcedure) throw new Error("עורך עם אותו שם כבר קיים");

    const newProcedure = new ProcedureType();
    newProcedure.name = name;
    newProcedure.createdAt = new Date();
    await this.proceduresTypeRepository.save(newProcedure);
    return newProcedure;
  }

  async editProcedureType(id: number, name: string): Promise<ProcedureType> {
    const existingProcedure = await this.proceduresTypeRepository.findOneBy({
      name,
    });
    if (existingProcedure) throw new Error("פרוצדורה עם אותו שם כבר קיימת");

    const editedProcedure = await this.proceduresTypeRepository.findOneBy({
      id,
    });
    if (!editedProcedure) throw new Error("פרוצדורה לא קיימת");
    editedProcedure.name = name;
    await this.proceduresTypeRepository.save(editedProcedure);
    return editedProcedure;
  }

  async deleteProcedureType(id: number): Promise<void> {
    const procedure = await this.proceduresTypeRepository.findOneBy({ id });
    if (!procedure) throw new Error("פרוצדורה לא קיימת");
    try {
      await this.proceduresTypeRepository.remove(procedure);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getAllExaminationTypes(): Promise<ExaminationType[]> {
    return await this.examinationTypeRepository.find();
  }

  async newExaminationType(name: string): Promise<ExaminationType> {
    const existingExaminationType =
      await this.examinationTypeRepository.findOneBy({ name });
    if (existingExaminationType)
      throw new Error("סוג בדיקה עם אותו שם כבר קיים");

    const newExaminationType = new ExaminationType();
    newExaminationType.name = name;
    newExaminationType.createdAt = new Date();
    await this.examinationTypeRepository.save(newExaminationType);
    return newExaminationType;
  }

  async editExaminationType(
    id: number,
    name: string
  ): Promise<ExaminationType> {
    const existingExaminationType =
      await this.examinationTypeRepository.findOneBy({ name });
    if (existingExaminationType)
      throw new Error("סוג בדיקה עם אותו שם כבר קיים");

    const editedExaminationType =
      await this.examinationTypeRepository.findOneBy({ id });
    if (!editedExaminationType) throw new Error("סוג בדיקה לא קיים");
    editedExaminationType.name = name;
    await this.examinationTypeRepository.save(editedExaminationType);
    return editedExaminationType;
  }

  async deleteExaminationType(id: number): Promise<void> {
    const examinationType = await this.examinationTypeRepository.findOneBy({
      id,
    });
    if (!examinationType) throw new Error("סוג בדיקה לא קיים");
    try {
      await this.examinationTypeRepository.remove(examinationType);
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  async getMedicinesRoutesForAdministration(): Promise<
    RouteOfAdministration[]
  > {
    return await this.routesForAdministrationRepository.find();
  }

  async newRouteOfAdministration(
    name: string,
    description: string
  ): Promise<RouteOfAdministration> {
    const existingRouteOfAdministration =
      await this.routesForAdministrationRepository.findOneBy({ name });
    if (existingRouteOfAdministration)
      throw new Error("אופן מתן עם שם זה כבר קיים");

    const newRouteOfAdministration = new RouteOfAdministration();
    newRouteOfAdministration.name = name;
    newRouteOfAdministration.description = description;
    newRouteOfAdministration.createdAt = new Date();
    await this.routesForAdministrationRepository.save(newRouteOfAdministration);
    return newRouteOfAdministration;
  }

  async editRouteOfAdministration(
    id: number,
    name: string,
    description: string
  ): Promise<RouteOfAdministration> {
    const existingRouteOfAdministration =
      await this.routesForAdministrationRepository.findOneBy({ name });
    if (existingRouteOfAdministration)
      throw new Error("אופן מתן עם שם זה כבר קיים");

    const editedRouteOfAdministration =
      await this.routesForAdministrationRepository.findOneBy({ id });
    if (!editedRouteOfAdministration) throw new Error("אופן מתן לא קיים");
    editedRouteOfAdministration.name = name;
    editedRouteOfAdministration.description = description;
    await this.routesForAdministrationRepository.save(
      editedRouteOfAdministration
    );
    return editedRouteOfAdministration;
  }

  async deleteRouteOfAdministration(id: number): Promise<void> {
    const routeOfAdministration =
      await this.routesForAdministrationRepository.findOneBy({ id });
    if (!routeOfAdministration) throw new Error("אופן מתן לא קיים");

    try {
      await this.routesForAdministrationRepository.remove(
        routeOfAdministration
      );
    } catch (err) {
      this.handleDeleteError(err);
    }
  }

  downloadBulkTemplate(systemType: SystemTypes): string {
    const columnNames = this.getColumnsNamesFromSystemType(systemType);
    const header = columnNames.map((column: string) => ({
      id: column,
      title: column,
    }));
    const csvStringifier = createObjectCsvStringifier({
      header,
    });
    const csvContent = csvStringifier.getHeaderString();
    return csvContent == null ? "" : "\uFEFF" + csvContent; // Adding BOM (\uFEFF) for Hebrew characters
  }

  getColumnsNamesFromSystemType(systemType: SystemTypes): string[] {
    switch (systemType) {
      case SystemTypes.MEDICINE:
        return [
          "שם",
          "טווח - מקסימום",
          "טווח - מינימום",
          "מינון כולל",
          "אופן מתן",
          "תדירות",
          "(mg/ml/meq) מידה",
          "שם קטגוריה",
          "הערות",
        ];
      case SystemTypes.ANIMAL_COLOR:
      case SystemTypes.ANIMAL_TYPE:
      case SystemTypes.FECES_TYPE:
      case SystemTypes.URINE_TYPE:
      case SystemTypes.FOOD_TYPE:
      case SystemTypes.GENDER_TYPE:
      case SystemTypes.INSURANCE_TYPE:
      case SystemTypes.FOOD_EXTRAS_TYPE:
      case SystemTypes.EXAMINATION_TYPE:
      case SystemTypes.MEASURE_UNIT_TYPE:
      case SystemTypes.PROCEDURE_TYPE:
        return ["שם"];
      case SystemTypes.ROUTE_OF_ADMINISTRATION:
        return ["שם", "תיאור"];
      case SystemTypes.DOSAGE_FREQUENCY_TYPE:
        return ["שם", "תיאור", "תיאור לפי שעה"];
      case SystemTypes.RACE_TYPE:
        return ["שם", "שם סוג חיה"];
      case SystemTypes.ANIMAL_VITALS:
        return [
          "שם סוג חיה",
          "(T/P/R) סוג",
          "טווח - מקסימום",
          "טווח - מינימום",
        ];
      default:
        return [];
    }
  }

  async uploadBulkTemplate(
    systemType: SystemTypes,
    csvContent: string
  ): Promise<string> {
    let errorMessage = "";
    const lines = csvContent.split("\n");
    const headers = lines[0].split(",").map((header: string) => header.trim());
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(",").map((value) => value.trim());
        const record: { [key: string]: string } = {};
        headers.forEach((header, index) => {
          record[header] = values[index].trim() || "";
        });
        records.push(record);
      }
    }

    for (let i = 0; i < records.length; i++) {
      try {
        const row = records[i];
        this.templateColumnsAmountValidation(row, systemType);

        switch (systemType) {
          case SystemTypes.MEDICINE:
            try {
              const measureUnitTypesRepository =
                this.measureUnitTypesRepository;
              const measureUnitType =
                await measureUnitTypesRepository.findOneBy({
                  name: row["(mg/ml/meq) מידה"],
                });

              if (!measureUnitType) throw new Error("יחידת מידה לא קיימת");

              const medicineCategory =
                await this.medicineCategoryRepository.findOneBy({
                  name: row["שם קטגוריה"],
                });

              if (!medicineCategory) throw new Error("קטגוריה לא קיימת");

              let dosageFrequency;
              const dosageFrequencyName = row["תדירות"];
              if (dosageFrequencyName) {
                dosageFrequency =
                  await this.dosageFrequencyRepository.findOneBy({
                    name: dosageFrequencyName,
                  });
                if (!dosageFrequency) throw new Error("תדירות לא קיימת");
              }

              let routeOfAdministration;
              const routeOfAdministrationName = row["אופן מתן"];
              if (routeOfAdministrationName) {
                routeOfAdministration =
                  await this.routesForAdministrationRepository.findOneBy({
                    name: routeOfAdministrationName,
                  });
                if (!routeOfAdministration) throw new Error("אופן מתן לא קיים");
              }

              const rangeMax =
                row["טווח - מקסימום"] === ""
                  ? undefined
                  : parseFloat(row["טווח - מקסימום"]);
              if (rangeMax && isNaN(rangeMax))
                throw new Error(`טווח מקסימום חייב להיות מספר`);

              const rangeMin =
                row["טווח - מינימום"] === ""
                  ? undefined
                  : parseFloat(row["טווח - מינימום"]);
              if (rangeMin && isNaN(rangeMin))
                throw new Error(`טווח מינימום חייב להיות מספר`);

              if (rangeMax && rangeMin && rangeMax < rangeMin)
                throw new Error(`טווח מינימום חייב להיות קטן מטווח מקסימום`);

              const totalDose =
                row["מינון כולל"] === ""
                  ? undefined
                  : parseFloat(row["מינון כולל"]);
              if (totalDose && isNaN(totalDose))
                throw new Error(`מינון כולל חייב להיות מספר`);

              await this.newMedicine(
                row["שם"],
                rangeMax,
                rangeMin,
                totalDose,
                routeOfAdministration ? routeOfAdministration.id : null,
                dosageFrequency ? dosageFrequency.id : null,
                measureUnitType.id,
                medicineCategory.id,
                row["הערות"]
              );
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.ANIMAL_COLOR:
            try {
              await this.newAnimalColor(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.ANIMAL_TYPE:
            try {
              await this.newAnimalType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.FECES_TYPE:
            try {
              await this.newFecesType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.URINE_TYPE:
            try {
              await this.newUrineType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.FOOD_TYPE:
            try {
              await this.newFoodType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.GENDER_TYPE:
            try {
              await this.newGenderType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.RACE_TYPE:
            try {
              const animalType = await this.animalTypeRepository.findOneBy({
                name: row["שם סוג חיה"],
              });

              if (!animalType) throw new Error("סוג חיה עם שם זה אינו קיים");
              await this.newRaceType(row["שם"], animalType.id);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.MEASURE_UNIT_TYPE:
            try {
              await this.newMeasureUnitType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.DOSAGE_FREQUENCY_TYPE:
            try {
              await this.newDosageFrequencyType(
                row["שם"],
                row["תיאור"],
                row["תיאור לפי שעה"]
              );
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.INSURANCE_TYPE:
            try {
              await this.newInsuranceType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.FOOD_EXTRAS_TYPE:
            try {
              await this.newFoodExtrasType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.PROCEDURE_TYPE:
            try {
              await this.newProcedureType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.EXAMINATION_TYPE:
            try {
              await this.newExaminationType(row["שם"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.ROUTE_OF_ADMINISTRATION:
            try {
              await this.newRouteOfAdministration(row["שם"], row["תיאור"]);
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          case SystemTypes.ANIMAL_VITALS:
            try {
              const animalType = await this.animalTypeRepository.findOneBy({
                name: row["שם סוג חיה"],
              });
              if (!animalType) throw new Error("סוג חיה עם שם זה אינו קיים");

              const vitalsType = row["(T/P/R) סוג"];
              if (
                !vitalsType ||
                (vitalsType !== "T" && vitalsType !== "P" && vitalsType !== "R")
              )
                throw new Error("סוג ההתראה אינו חוקי");

              const rangeMax =
                row["טווח - מקסימום"] === ""
                  ? undefined
                  : parseFloat(row["טווח - מקסימום"]);
              if (rangeMax && isNaN(rangeMax))
                throw new Error(`טווח מקסימום חייב להיות מספר`);

              const rangeMin =
                row["טווח - מינימום"] === ""
                  ? undefined
                  : parseFloat(row["טווח - מינימום"]);
              if (rangeMin && isNaN(rangeMin))
                throw new Error(`טווח מינימום חייב להיות מספר`);

              await this.newAnimalVitals(
                animalType.id,
                vitalsType,
                rangeMax,
                rangeMin
              );
            } catch (err: any) {
              errorMessage +=
                "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
            }
            break;
          default:
            break;
        }
      } catch (err: any) {
        errorMessage += "שגיאה בשורה " + (i + 1) + ": " + err.message + "\n";
      }
    }

    return errorMessage;
  }

  templateColumnsAmountValidation(row: any, systemType: SystemTypes) {
    if (
      Object.keys(row).length !==
      this.getColumnsNamesFromSystemType(systemType).length
    )
      throw new Error("מספר עמודות לא תקינים");
  }

  handleDeleteError(err: any) {
    if (err.code == KEY_CONSTRAINT_ERROR_CODE)
      throw new Error(KEY_CONSTRAINT_ERROR_MESSAGE);
    else throw new Error(SYSTEM_ERROR_MESSAGE);
  }
}

export default new AdminService();
