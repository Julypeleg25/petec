import { Express } from "express";
import request from "supertest";
import initApp from "../../config/app";
import { AppDataSource } from "../../config/typeORM";
import AdminService from "../services/AdminService";
import AuthService from "../services/AuthService";
import logger from "../utils/Logger";
import { deleteAllDBTablesData } from "./TestUtils";

let app: Express;
let adminAccessToken: string;

const adminUser = {
  username: "adminTest",
  password: "12345aA",
  firstName: "Gidi",
  lastName: "Shosh",
  email: "GidiShosh2@gmail.com",
  roleId: 1,
  id: 0,
};

const medicine1 = {
  name: "Nurofen",
  unit: 0,
  categoryId: 0,
};

const medicine2 = {
  name: "Advil",
  unit: 0,
  categoryId: 0,
};

const measureUnit = {
  name: "mg",
};

const dosageFrequency = {
  name: "1 / hour",
  description: "One time per hour",
  descriptionPerHour: "1",
};

const medicinesRoute = {
  name: "route",
  description: "admin",
};

const userRole = {
  id: 0,
  name: "ADMIN",
};

beforeAll(async () => {
  logger.info("start medicine beforeAll");
  app = await initApp();

  userRole.id = (await AdminService.newUserRole(userRole.name)).id;
  adminUser.roleId = userRole.id;

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

  const measureUnitResponse = await AdminService.newMeasureUnitType(
    measureUnit.name
  );
  medicine1.unit = measureUnitResponse.id;
  medicine2.unit = measureUnitResponse.id;

  medicine1.categoryId = (
    await AdminService.newMedicineCategory("Antibiotics")
  ).id;
  medicine2.categoryId = (
    await AdminService.newMedicineCategory("Vitamins")
  ).id;

  logger.info("end medicine beforeAll");
});

afterAll(async () => {
  logger.info("start medicine afterAll");

  await deleteAllDBTablesData();
  await AppDataSource.destroy();

  logger.info("end medicine afterAll");
});

describe("Medicine Tests", () => {
  test("Test get measure unit types", async () => {
    const response = await request(app)
      .get("/medicine/measureUnitTypes")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.body).toContainEqual(expect.objectContaining(measureUnit));
    expect(response.statusCode).toBe(200);
  });

  test("Test get all medicines", async () => {
    const createNewMedicineResponse = await request(app)
      .post("/admin/medicine/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send(medicine1);
    const response = await request(app)
      .get("/medicine/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(createNewMedicineResponse.body.id);
    expect(response.body[0].name).toBe(createNewMedicineResponse.body.name);
    expect(response.statusCode).toBe(200);
  });

  test("Test get all by category type", async () => {
    const createNewMedicineResponse = await request(app)
      .post("/admin/medicine/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send(medicine2);
    const response = await request(app)
      .get("/medicine/getAllByCategoryType/" + medicine2.categoryId)
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(createNewMedicineResponse.body.id);
    expect(response.body[0].name).toBe(createNewMedicineResponse.body.name);
    expect(response.statusCode).toBe(200);
  });

  test("Test get all dosage frequency types", async () => {
    const createNewDosageFrequency = await request(app)
      .post("/admin/dosageFrequencyType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send(dosageFrequency);
    const response = await request(app)
      .get("/medicine/medicinesFrequencies")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.body).toContainEqual(createNewDosageFrequency.body);
    expect(response.statusCode).toBe(200);
  });

  test("Test get medicines routes for administration", async () => {
    const createMedicinesRoutesForAdministration = await request(app)
      .post("/admin/routeOfAdministration/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send(medicinesRoute);
    const response = await request(app)
      .get("/medicine/medicinesRoutesForAdministration")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.body).toContainEqual(
      createMedicinesRoutesForAdministration.body
    );
    expect(response.statusCode).toBe(200);
  });

  test("Test get all category types", async () => {
    const response = await request(app)
      .get("/medicine/getAllCategoryTypes")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });
});
