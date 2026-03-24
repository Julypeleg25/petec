import { Express } from "express";
import request from "supertest";
import initApp from "../../config/app";
import { AppDataSource } from "../../config/typeORM";
import AuthService from "../services/AuthService";
import logger from "../../api/utils/Logger";
import AdminService from "../services/AdminService";
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

const userRole = {
  id: 0,
  name: "ADMIN",
};

beforeAll(async () => {
  logger.info("start user beforeAll");
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

  logger.info("end user beforeAll");
});

afterAll(async () => {
  logger.info("start user afterAll");

  await deleteAllDBTablesData();
  await AppDataSource.destroy();

  logger.info("end user afterAll");
});

describe("user tests", () => {
  test("Test get all doctors", async () => {
    const response = await request(app)
      .get("/user/doctors")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test get all nurses", async () => {
    const response = await request(app)
      .get("/user/nurses")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });
});
