import { Express } from "express";
import request from "supertest";
import initApp from "../../config/app";
import { AppDataSource } from "../../config/typeORM";
import { IsNull, Not, Repository } from "typeorm";
import AuthService from "../services/AuthService";
import { Patient } from "../models/Patient";
import logger from "../utils/Logger";
import AdminService from "../services/AdminService";
import CaseService from "../services/CaseService";
import { deleteAllDBTablesData } from "./TestUtils";

let app: Express;

let patientId: number;

let patient = {
  name: "Bell",
  ownerName: "Yosef",
  ownerPhoneNumber: "0500000000",
  hospitalizationReason: "Broken leg",
  weightKg: 3,
  doctorId: null,
  nurseId: null,
  animalId: null,
  genderId: null,
  raceId: null,
  caseId: "1",
  isCerenia: true,
  isConvenia: true,
  ageYears: 5,
  animalColorId: null,
  foodTypeId: null,
  catheterDate: "",
  isProcedure: false,
  insuranceId: null,
  isAllergic: false,
  isEscapePotential: true,
  isAggressive: false,
  isNPO: false,
  isRiskAnesthesia: false,
  isHeartMurmur: false,
  isAMB: true,
};

let doctor = {
  username: "testDoctor",
  password: "Aa123455",
  firstName: "Test",
  lastName: "Doctor",
  email: "test@example.com",
  roleId: 2,
};

let nurse = {
  username: "testNurse",
  password: "Aa123455",
  firstName: "Test",
  lastName: "Nurse",
  email: "test2@example.com",
  roleId: 3,
};

let anesthesiaProcedureFormData = {
  name: patient.name,
  ownerName: patient.ownerName,
  plannedProcedure: "surgery",
  priceEstimate: 500,
  date: "02/10/2024",
  isFastSinceMidnight: true,
  isDistortionHistory: false,
  isMedicationsSensitive: true,
  isNeedToMarkEar: false,
  isSterilization: true,
  isPriceIncludesReleaseMedications: true,
  caseId: patient.caseId,
  signature: "LIRI",
};

const adminUser = {
  username: "adminTest",
  password: "12345aA",
  firstName: "Gidi",
  lastName: "Shosh",
  email: "GidiShosh2@gmail.com",
  roleId: 1,
  id: 0,
};

const adminRole = {
  id: 0,
  name: "ADMIN",
};

const doctorRole = {
  id: 0,
  name: "DOCTOR",
};

const nurseRole = {
  id: 0,
  name: "NURSE",
};

let adminAccessToken: string;
let caseService: CaseService = new CaseService();

async function initializeRoles(): Promise<void> {
  adminRole.id = (await AdminService.newUserRole(adminRole.name)).id;
  doctorRole.id = (await AdminService.newUserRole(doctorRole.name)).id;
  nurseRole.id = (await AdminService.newUserRole(nurseRole.name)).id;
}

beforeAll(async () => {
  logger.info("start patient beforeAll");
  app = await initApp();

  await initializeRoles();
  adminUser.roleId = adminRole.id;
  nurse.roleId = nurseRole.id;
  doctor.roleId = doctorRole.id;

  adminUser.id = (
    await AuthService.register(
      adminUser.username,
      adminUser.password,
      adminUser.firstName,
      adminUser.lastName,
      adminUser.email,
      adminUser.roleId
    )
  ).id;

  adminAccessToken = (
    await AuthService.login(adminUser.username, adminUser.password)
  ).accessToken;

  const doctorId = (
    await request(app)
      .post("/auth/register")
      .set("authorization", "JWT " + adminAccessToken)
      .send(doctor)
  ).body.id;

  const nurseId = (
    await request(app)
      .post("/auth/register")
      .set("authorization", "JWT " + adminAccessToken)
      .send(nurse)
  ).body.id;

  const animalId = (
    await request(app)
      .post("/admin/animalType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Cat" })
  ).body.id;

  const genderId = (
    await request(app)
      .post("/admin/genderType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Male" })
  ).body.id;

  const raceId = (
    await request(app)
      .post("/admin/raceType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Siamese", animalTypeId: animalId })
  ).body.id;

  const animalColorId = (
    await request(app)
      .post("/admin/animalColor/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Black" })
  ).body.id;

  const foodTypeId = (
    await request(app)
      .post("/admin/foodType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Bonzo" })
  ).body.id;

  const insuranceId = (
    await request(app)
      .post("/admin/insuranceType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Harel" })
  ).body.id;

  patient = {
    ...patient,
    doctorId: doctorId,
    nurseId: nurseId,
    animalId: animalId,
    genderId: genderId,
    raceId: raceId,
    animalColorId: animalColorId,
    foodTypeId: foodTypeId,
    insuranceId: insuranceId,
  };

  logger.info("end patient beforeAll");
});

describe("patient tests", () => {
  test("Test add new patient", async () => {
    const response = await request(app)
      .post("/patient/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send(patient);

    expect(response.statusCode).toBe(201);

    const patientRepository: Repository<Patient> =
      AppDataSource.getRepository(Patient);

    const patientObject = await patientRepository.findOne({
      where: { id: Not(IsNull()) },
      order: {
        id: "DESC",
      },
    });

    expect(patientObject).not.toBeNull();
    expect(patient.name).toBe(patientObject!.name);

    patientId = patientObject!.id;
    const patientCase = await caseService.getCaseByPatientId(patientId);
    patient.caseId = patientCase!.id;
    anesthesiaProcedureFormData.caseId = patient.caseId;
  });

  test("Test edit patient", async () => {
    patient = {
      ...patient,
      ownerPhoneNumber: "0520000000",
      ownerName: "Liri",
    };

    const response = await request(app)
      .post("/patient/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: patientId, ...patient });

    expect(response.statusCode).toBe(200);
    expect(response.body.ownerPhoneNumber).toBe(patient.ownerPhoneNumber);
    expect(response.body.ownerName).toBe(patient.ownerName);
  });

  test("Test edit patient with incorrect id", async () => {
    patient = {
      ...patient,
      ownerPhoneNumber: "0520000000",
      ownerName: "Liri",
    };

    const response = await request(app)
      .post("/patient/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: "fakeId", ...patient });

    expect(response.statusCode).toBe(400);
  });

  test("Test get case daily details", async () => {
    const response = await request(app)
      .get("/patient/case/details/" + patient.caseId[0] + "/" + patient.caseId)
      .set("authorization", "JWT " + adminAccessToken);

    logger.info(response.body);
    expect(response.statusCode).toBe(200);
  });

  test("Test new anesthesia procedure form", async () => {
    const response = await request(app)
      .post("/patient/case/anesthesiaProcedureForm/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send(anesthesiaProcedureFormData);

    expect(response.statusCode).toBe(201);
  });

  test("Test get anesthesia procedure form", async () => {
    const response = await request(app)
      .get("/patient/case/anesthesiaProcedureForm/" + patient.caseId)
      .set("authorization", "JWT " + adminAccessToken);

    expect(response.statusCode).toBe(200);
  });

  test("Test edit anesthesia procedure form", async () => {
    anesthesiaProcedureFormData = {
      ...anesthesiaProcedureFormData,
      priceEstimate: 600,
      isSterilization: false,
    };

    const response = await request(app)
      .put("/patient/case/anesthesiaProcedureForm/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send(anesthesiaProcedureFormData);

    expect(response.statusCode).toBe(200);
  });

  test("Test get case food extras types", async () => {
    const response = await request(app)
      .get("/patient/case/foodExtrasTypes")
      .set("authorization", "JWT " + adminAccessToken);

    expect(response.statusCode).toBe(200);
  });

  test("Test get examinations", async () => {
    const response = await request(app)
      .get("/patient/case/examinations")
      .set("authorization", "JWT " + adminAccessToken);

    expect(response.statusCode).toBe(200);
  });

  test("Test release patient", async () => {
    const response = await request(app)
      .post("/patient/release")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        caseId: patient.caseId,
        stitchesRemovalDate: "01/01/2025",
        nextInspectionDate: "01/01/2025",
        medicines: [],
      });

    expect(response.statusCode).toBe(200);
  });

  test("Test export patient case", async () => {
    const response = await request(app)
      .post("/patient/exportPatientCase/" + patient.caseId)
      .set("authorization", "JWT " + adminAccessToken)
      .send();

    expect(response.statusCode).toBe(200);
  }, 60000);

  test("Test get documents", async () => {
    const response = await request(app)
      .get("/patient/documents/" + patient.caseId)
      .set("authorization", "JWT " + adminAccessToken)
      .send();

    expect(response.statusCode).toBe(200);
  });

  test("Test release patient data", async () => {
    const response = await request(app)
      .get("/patient/releasePatientData/" + patient.caseId)
      .set("authorization", "JWT " + adminAccessToken)
      .send();

    expect(response.statusCode).toBe(200);
  });

  test("Test delete patient", async () => {
    const response = await request(app)
      .delete("/patient/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ patientId: patientId });

    expect(response.statusCode).toBe(200);
  });
});

afterAll(async () => {
  logger.info("start patient afterAll");

  await deleteAllDBTablesData();
  await AppDataSource.destroy();

  logger.info("end patient afterAll");
});
