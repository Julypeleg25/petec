import { Response } from "express";
import { AuthRequest } from "../middlewares/AuthMiddleware";
import AdminService from "../services/AdminService";
import logger from "../../api/utils/Logger";
import { SystemTypes } from "../enums/SystemTypes";

class AdminController {
  async getAllAnimalTypes(req: AuthRequest, res: Response) {
    try {
      const animalTypes = await AdminService.getAllAnimalTypes();
      res.status(200).json(animalTypes);
    } catch (err: any) {
      logger.error("Failed to get all animal types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newAnimalType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newAnimalType = await AdminService.newAnimalType(name);
      res.status(200).json(newAnimalType);
    } catch (err: any) {
      logger.error("Failed to create new animal type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editAnimalType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedAnimalType = await AdminService.editAnimalType(id, name);
      res.status(200).json(editedAnimalType);
    } catch (err: any) {
      logger.error("Failed to edit animal type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteAnimalType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteAnimalType(id);
      res.status(200).json("Animal type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete animal type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllRaceTypes(req: AuthRequest, res: Response) {
    try {
      const raceTypes = await AdminService.getAllRaceTypes();
      res.status(200).json(raceTypes);
    } catch (err: any) {
      logger.error("Failed to get all race types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getRaceTypesByAnimalId(req: AuthRequest, res: Response) {
    try {
      const animalId = Number.parseInt(req.params.id);
      const raceTypes = await AdminService.getRaceTypesByAnimalId(animalId);
      res.status(200).json(raceTypes);
    } catch (err: any) {
      logger.error("Failed to get race types by animal id: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newRaceType(req: AuthRequest, res: Response) {
    try {
      const { name, animalTypeId } = req.body;
      const newRaceType = await AdminService.newRaceType(name, animalTypeId);
      res.status(200).json(newRaceType);
    } catch (err: any) {
      logger.error("Failed to create new race type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editRaceType(req: AuthRequest, res: Response) {
    try {
      const { id, name, animalTypeId } = req.body;
      const editedRaceType = await AdminService.editRaceType(
        id,
        name,
        animalTypeId
      );
      res.status(200).json(editedRaceType);
    } catch (err: any) {
      logger.error("Failed to edit race type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteRaceType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteRaceType(id);
      res.status(200).json("Animal race deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete animal race: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllAnimalColors(req: AuthRequest, res: Response) {
    try {
      const animalTypes = await AdminService.getAllAnimalColors();
      res.status(200).json(animalTypes);
    } catch (err: any) {
      logger.error("Failed to get all animal colors: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newAnimalColor(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newAnimalColor = await AdminService.newAnimalColor(name);
      res.status(200).json(newAnimalColor);
    } catch (err: any) {
      logger.error("Failed to create new animal color: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editAnimalColor(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedAnimalColor = await AdminService.editAnimalColor(id, name);
      res.status(200).json(editedAnimalColor);
    } catch (err: any) {
      logger.error("Failed to edit animal color: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteAnimalColor(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteAnimalColor(id);
      res.status(200).json("Animal color deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete animal color: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async allByAnimalId(req: AuthRequest, res: Response) {
    try {
      const animalId = Number.parseInt(req.params.animalId);
      const animalVitals = await AdminService.getAnimalVitalsByAnimalId(
        animalId
      );
      res.status(200).json(animalVitals);
    } catch (err: any) {
      logger.error("Failed to get animal vitals: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newAnimalVitals(req: AuthRequest, res: Response) {
    try {
      const { animalId, type, rangeMin, rangeMax } = req.body;
      const newAnimalAlert = await AdminService.newAnimalVitals(
        animalId,
        type,
        rangeMin,
        rangeMax
      );
      res.status(200).json(newAnimalAlert);
    } catch (err: any) {
      logger.error("Failed to create new animal vitals alert: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editAnimalVitals(req: AuthRequest, res: Response) {
    try {
      const { id, rangeMin, rangeMax } = req.body;
      const editedAnimalAlert = await AdminService.editAnimalVitals(
        id,
        rangeMin,
        rangeMax
      );
      res.status(200).json(editedAnimalAlert);
    } catch (err: any) {
      logger.error("Failed to edit animal vitals alert: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteAnimalVitals(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteAnimalVitals(id);
      res.status(200).json("Animal vitals alert deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete animal alert: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllFecesTypes(req: AuthRequest, res: Response) {
    try {
      const fecesTypes = await AdminService.getAllFecesTypes();
      res.status(200).json(fecesTypes);
    } catch (err: any) {
      logger.error("Failed to get all feces types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newFecesType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newFecesType = await AdminService.newFecesType(name);
      res.status(200).json(newFecesType);
    } catch (err: any) {
      logger.error("Failed to create new feces type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editFecesType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedFecesType = await AdminService.editFecesType(id, name);
      res.status(200).json(editedFecesType);
    } catch (err: any) {
      logger.error("Failed to edit feces type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteFecesType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteFecesType(id);
      res.status(200).json("Feces type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete feces type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllFoodTypes(req: AuthRequest, res: Response) {
    try {
      const foodTypes = await AdminService.getAllFoodTypes();
      res.status(200).json(foodTypes);
    } catch (err: any) {
      logger.error("Failed to get all food types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newFoodType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newFoodType = await AdminService.newFoodType(name);
      res.status(200).json(newFoodType);
    } catch (err: any) {
      logger.error("Failed to create new food type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editFoodType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedFoodType = await AdminService.editFoodType(id, name);
      res.status(200).json(editedFoodType);
    } catch (err: any) {
      logger.error("Failed to edit food type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteFoodType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteFoodType(id);
      res.status(200).json("Food type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete food type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllGenderTypes(req: AuthRequest, res: Response) {
    try {
      const genderTypes = await AdminService.getAllGenderTypes();
      res.status(200).json(genderTypes);
    } catch (err: any) {
      logger.error("Failed to get all gender types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newGenderType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newGenderType = await AdminService.newGenderType(name);
      res.status(200).json(newGenderType);
    } catch (err: any) {
      logger.error("Failed to create new gender type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editGenderType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedGenderType = await AdminService.editGenderType(id, name);
      res.status(200).json(editedGenderType);
    } catch (err: any) {
      logger.error("Failed to edit gender type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteGenderType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteGenderType(id);
      res.status(200).json("Gender type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete gender type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllUrineTypes(req: AuthRequest, res: Response) {
    try {
      const urineTypes = await AdminService.getAllUrineTypes();
      res.status(200).json(urineTypes);
    } catch (err: any) {
      logger.error("Failed to get all urine types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newUrineType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newUrineType = await AdminService.newUrineType(name);
      res.status(200).json(newUrineType);
    } catch (err: any) {
      logger.error("Failed to create new urine type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editUrineType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedUrineType = await AdminService.editUrineType(id, name);
      res.status(200).json(editedUrineType);
    } catch (err: any) {
      logger.error("Failed to edit urine type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteUrineType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteUrineType(id);
      res.status(200).json("Urine type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete urine type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editUser(req: AuthRequest, res: Response) {
    try {
      const { id, username, email, firstName, lastName, roleId } = req.body;
      const editedUser = await AdminService.editUser(
        id,
        username,
        email,
        firstName,
        lastName,
        roleId
      );
      res.status(200).json({
        firstName: editedUser.firstName,
        lastName: editedUser.lastName,
        roleName: editedUser.roleName,
      });
    } catch (err: any) {
      logger.error("Failed to edit user: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteUser(id);
      res.status(200).json("User deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete user: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllDoctors(req: AuthRequest, res: Response) {
    try {
      const doctors = await AdminService.getAllDoctors();
      res.status(200).json(doctors);
    } catch (err: any) {
      logger.error("Failed to get all doctors: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllNurses(req: AuthRequest, res: Response) {
    try {
      const nurses = await AdminService.getAllNurses();
      res.status(200).json(nurses);
    } catch (err: any) {
      logger.error("Failed to get all nurses: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllMedicines(req: AuthRequest, res: Response) {
    try {
      const medicines = await AdminService.getAllMedicines();
      res.status(200).json(medicines);
    } catch (err: any) {
      logger.error("Failed to get all medicines: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllByMedicinesCategoryType(req: AuthRequest, res: Response) {
    try {
      const categoryId = Number.parseInt(req.params.id);
      const medicines = await AdminService.getAllMedicinesByCategoryType(
        categoryId
      );
      res.status(200).json(medicines);
    } catch (err: any) {
      logger.error("Failed to get all medicines by category: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newMedicine(req: AuthRequest, res: Response) {
    try {
      const {
        name,
        rangeMax,
        rangeMin,
        totalDose,
        routeOfAdministrationId,
        dosageFrequencyId,
        unit,
        categoryId,
        comments,
      } = req.body;
      const newMedicine = await AdminService.newMedicine(
        name,
        rangeMax,
        rangeMin,
        totalDose,
        routeOfAdministrationId,
        dosageFrequencyId,
        unit,
        categoryId,
        comments
      );
      res.status(200).json(newMedicine);
    } catch (err: any) {
      logger.error("Failed to create new medicine: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editMedicine(req: AuthRequest, res: Response) {
    try {
      const {
        id,
        name,
        rangeMax,
        rangeMin,
        totalDose,
        routeOfAdministrationId,
        dosageFrequencyId,
        unit,
        categoryId,
        comments,
      } = req.body;
      const editedMedicine = await AdminService.editMedicine(
        id,
        name,
        rangeMax,
        rangeMin,
        totalDose,
        routeOfAdministrationId,
        dosageFrequencyId,
        unit,
        categoryId,
        comments
      );
      res.status(200).json(editedMedicine);
    } catch (err: any) {
      logger.error("Failed to edit medicine: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteMedicine(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteMedicine(id);
      res.status(200).json("Medicine deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete medicine: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllMedicineCategoryTypes(req: AuthRequest, res: Response) {
    try {
      const medicinesCategoryTypes =
        await AdminService.getAllMedicineCategoryTypes();
      res.status(200).json(medicinesCategoryTypes);
    } catch (err: any) {
      logger.error(
        "Failed to get all medicines category types: " + err.message
      );
      res.status(500).json({ error: err.message });
    }
  }

  async getAllMeasureUnitTypes(req: AuthRequest, res: Response) {
    try {
      const measureUnitTypes = await AdminService.getAllMeasureUnitTypes();
      res.status(200).json(measureUnitTypes);
    } catch (err: any) {
      logger.error("Failed to get all measure unit types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newMeasureUnitType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newMeasureUnitType = await AdminService.newMeasureUnitType(name);
      res.status(200).json(newMeasureUnitType);
    } catch (err: any) {
      logger.error("Failed to create new measure unit type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editMeasureUnitType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedMeasureUnitType = await AdminService.editMeasureUnitType(
        id,
        name
      );
      res.status(200).json(editedMeasureUnitType);
    } catch (err: any) {
      logger.error("Failed to edit measure unit type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteMeasureUnitType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteMeasureUnitType(id);
      res.status(200).json("Measure unit type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete measure unit type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllDosageFrequencyTypes(req: AuthRequest, res: Response) {
    try {
      const medicinesFrequencies =
        await AdminService.getAllDosageFrequencyTypes();
      res.status(200).json(medicinesFrequencies);
    } catch (err: any) {
      logger.error("Failed to get all medicines frequencies: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newDosageFrequencyType(req: AuthRequest, res: Response) {
    try {
      const { name, description, descriptionPerHour } = req.body;
      const newDosageFrequencyType = await AdminService.newDosageFrequencyType(
        name,
        description,
        descriptionPerHour
      );
      res.status(200).json(newDosageFrequencyType);
    } catch (err: any) {
      logger.error(
        "Failed to create new dosage frequency type: " + err.message
      );
      res.status(500).json({ error: err.message });
    }
  }

  async editDosageFrequencyType(req: AuthRequest, res: Response) {
    try {
      const { id, name, description, descriptionPerHour } = req.body;
      const editedDosageFrequencyType =
        await AdminService.editDosageFrequencyType(
          id,
          name,
          description,
          descriptionPerHour
        );
      res.status(200).json(editedDosageFrequencyType);
    } catch (err: any) {
      logger.error("Failed to edit dosage frequency type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteDosageFrequencyType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteDosageFrequencyType(id);
      res.status(200).json("Dosage frequency type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete dosage frequency type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllInsuranceTypes(req: AuthRequest, res: Response) {
    try {
      const insuranceTypes = await AdminService.getAllInsuranceTypes();
      res.status(200).json(insuranceTypes);
    } catch (err: any) {
      logger.error("Failed to get all insurance types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newInsuranceType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newInsuranceType = await AdminService.newInsuranceType(name);
      res.status(200).json(newInsuranceType);
    } catch (err: any) {
      logger.error("Failed to create new insurance type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editInsuranceType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedInsuranceType = await AdminService.editInsuranceType(
        id,
        name
      );
      res.status(200).json(editedInsuranceType);
    } catch (err: any) {
      logger.error("Failed to edit insurance type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteInsuranceType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteInsuranceType(id);
      res.status(200).json("Insurance type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete insurance type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllFoodExtrasTypes(req: AuthRequest, res: Response) {
    try {
      const foodExtrasTypes = await AdminService.getAllFoodExtrasTypes();
      res.status(200).json(foodExtrasTypes);
    } catch (err: any) {
      logger.error("Failed to get all food extras types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newFoodExtrasType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newFoodExtrasType = await AdminService.newFoodExtrasType(name);
      res.status(200).json(newFoodExtrasType);
    } catch (err: any) {
      logger.error("Failed to create new food extras type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editFoodExtrasType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedFoodExtrasType = await AdminService.editFoodExtrasType(
        id,
        name
      );
      res.status(200).json(editedFoodExtrasType);
    } catch (err: any) {
      logger.error("Failed to edit food extras type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteFoodExtrasType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteFoodExtrasType(id);
      res.status(200).json("Food extras type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete food extras type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllProceduresTypes(req: AuthRequest, res: Response) {
    try {
      const procedures = await AdminService.getAllProceduresTypes();
      res.status(200).json(procedures);
    } catch (err: any) {
      logger.error("Failed to get all procedures types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newProcedureType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newProcedure = await AdminService.newProcedureType(name);
      res.status(200).json(newProcedure);
    } catch (err: any) {
      logger.error("Failed to create new procedure type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editProcedureType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedProcedure = await AdminService.editProcedureType(id, name);
      res.status(200).json(editedProcedure);
    } catch (err: any) {
      logger.error("Failed to edit procedure type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteProcedureType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteProcedureType(id);
      res.status(200).json("Procedure type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete procedure type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getAllExaminationTypes(req: AuthRequest, res: Response) {
    try {
      const examinationTypes = await AdminService.getAllExaminationTypes();
      res.status(200).json(examinationTypes);
    } catch (err: any) {
      logger.error("Failed to get all examination types: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async newExaminationType(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const newExaminationType = await AdminService.newExaminationType(name);
      res.status(200).json(newExaminationType);
    } catch (err: any) {
      logger.error("Failed to create new examination type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async editExaminationType(req: AuthRequest, res: Response) {
    try {
      const { id, name } = req.body;
      const editedExaminationType = await AdminService.editExaminationType(
        id,
        name
      );
      res.status(200).json(editedExaminationType);
    } catch (err: any) {
      logger.error("Failed to edit examination type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteExaminationType(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteExaminationType(id);
      res.status(200).json("Examination type deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete examination type: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async getMedicinesRoutesForAdministration(req: AuthRequest, res: Response) {
    try {
      const medicinesRoutesForAdministration =
        await AdminService.getMedicinesRoutesForAdministration();
      res.status(200).json(medicinesRoutesForAdministration);
    } catch (err: any) {
      logger.error(
        "Failed to get all medicines routes for administration: " + err.message
      );
      res.status(500).json({ error: err.message });
    }
  }

  async newRouteOfAdministration(req: AuthRequest, res: Response) {
    try {
      const { name, description } = req.body;
      const newRouteOfAdministration =
        await AdminService.newRouteOfAdministration(name, description);
      res.status(200).json(newRouteOfAdministration);
    } catch (err: any) {
      logger.error(
        "Failed to create new route of administration: " + err.message
      );
      res.status(500).json({ error: err.message });
    }
  }

  async editRouteOfAdministration(req: AuthRequest, res: Response) {
    try {
      const { id, name, description } = req.body;
      const editedRouteOfAdministration =
        await AdminService.editRouteOfAdministration(id, name, description);
      res.status(200).json(editedRouteOfAdministration);
    } catch (err: any) {
      logger.error("Failed to edit route of administration: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteRouteOfAdministration(req: AuthRequest, res: Response) {
    try {
      const { id } = req.body;
      await AdminService.deleteRouteOfAdministration(id);
      res.status(200).json("Route of administration deleted successfully");
    } catch (err: any) {
      logger.error("Failed to delete route of administration: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async downloadBulkTemplate(req: AuthRequest, res: Response) {
    try {
      const { systemType } = req.body;
      const csvContent = AdminService.downloadBulkTemplate(systemType);

      if (csvContent === null || csvContent === "")
        throw new Error("שגיאת מערכת בייצוא הקובץ");
      const filename = `${systemType}_template.csv`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("X-Filename", filename);

      res.send(csvContent);
    } catch (err: any) {
      logger.error("Failed to download bulk template: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }

  async uploadBulkTemplate(req: AuthRequest, res: Response) {
    try {
      const systemType = req.params.systemType;
      const systemTypeValue = (SystemTypes as any)[systemType];
      const file = req.file;
      if (file.mimetype !== "text/csv") {
        throw new Error("CSV אנא העלה/י קובץ בפורמט");
      }

      const data = file.buffer.toString("utf8");

      if (data === null || data === "") throw new Error("The file is empty.");

      const errorMessage = await AdminService.uploadBulkTemplate(
        systemTypeValue,
        data
      );

      if (errorMessage !== "") res.status(500).json({ error: errorMessage });
      else res.sendStatus(200);
    } catch (err: any) {
      logger.error("Failed to upload bulk template: " + err.message);
      res.status(500).json({ error: err.message });
    }
  }
}

export default new AdminController();
