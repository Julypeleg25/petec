import request from "supertest";
import initApp from "../../config/app";
import { Express } from "express";
import "dotenv/config";
import { AppDataSource } from "../../config/typeORM";
import AuthService from "../services/AuthService";
import logger from "../utils/Logger";
import AdminService from "../services/AdminService";
import { deleteAllDBTablesData } from "./TestUtils";

let app: Express;

const adminUser = {
  username: "adminTest",
  password: "12345aA",
  firstName: "Gidi",
  lastName: "Shosh",
  email: "GidiShosh2@gmail.com",
  roleId: 1,
  id: 0,
};

let user = {
  username: "testUser",
  password: "Aa123455",
  firstName: "Test",
  lastName: "User",
  email: "test5@example.com",
  roleId: 1,
};

const userRole = {
  id: 0,
  name: "ADMIN",
};

let adminAccessToken: string;
let userAccessToken: string;
let userRefreshToken: string;

beforeAll(async () => {
  logger.info("start auth beforeAll");
  app = await initApp();

  userRole.id = (await AdminService.newUserRole(userRole.name)).id;
  adminUser.roleId = userRole.id;
  user.roleId = userRole.id;

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

  logger.info("end auth beforeAll");
});

afterAll(async () => {
  logger.info("start auth afterAll");

  await deleteAllDBTablesData();
  await AppDataSource.destroy();

  logger.info("end auth afterAll");
});

describe("Auth tests", () => {
  test("Test Register", async () => {
    const response = await request(app)
      .post("/auth/register")
      .set("authorization", "JWT " + adminAccessToken)
      .send(user);
    expect(response.statusCode).toBe(201);
  });

  test("Test Register exist username", async () => {
    const response = await request(app)
      .post("/auth/register")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ ...user, email: "anotherMail@example.com" });
    expect(response.statusCode).toBe(500);
    expect(response.text.includes("שם משתמש כבר קיים"));
  });

  test("Test Register exist email", async () => {
    const response = await request(app)
      .post("/auth/register")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ ...user, username: "anotherTestuser" });
    expect(response.statusCode).toBe(500);
    expect(response.text.includes("אימייל כבר קיים"));
  });

  test("Test Register does not exist role ID", async () => {
    const response = await request(app)
      .post("/auth/register")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        ...user,
        email: "anotherMail@example.com",
        username: "anotherTestuser",
        roleId: -1,
      });
    expect(response.statusCode).toBe(500);
    expect(response.text.includes("תפקיד עם מספר זהות זה לא קיים"));
  });

  test("Test Login with incorrect password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ username: user.username, password: "incorrectPassword" });
    expect(response.statusCode).toBe(500);
  });

  test("Test Login", async () => {
    const response = await request(app)
      .post("/auth/login")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ username: user.username, password: user.password });
    expect(response.statusCode).toBe(200);
    userAccessToken = response.body.accessToken;
    userRefreshToken = response.body.refreshToken;
    expect(userAccessToken).toBeDefined();
    expect(userRefreshToken).toBeDefined();
  });

  test("Test forbidden access without token", async () => {
    const response = await request(app).get("/user/doctors");
    expect(response.statusCode).toBe(401);
  });

  test("Test access with valid token", async () => {
    const response = await request(app)
      .get("/user/doctors")
      .set("Authorization", "JWT " + userAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test access with invalid token", async () => {
    const response = await request(app)
      .get("/user/doctors")
      .set("Authorization", "JWT 1" + userAccessToken);
    expect(response.statusCode).toBe(401);
  });

  test("Test refresh token", async () => {
    const response = await request(app)
      .post("/auth/refreshToken")
      .send({ refreshToken: userRefreshToken });
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    userAccessToken = response.body.accessToken;
    userRefreshToken = response.body.refreshToken;

    const response2 = await request(app)
      .get("/user/doctors")
      .set("Authorization", "JWT " + userAccessToken);
    expect(response2.statusCode).toBe(200);
  });

  test("Test logout with null refresh token", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .send({ refreshToken: null });
    expect(response.statusCode).toBe(400);
  });

  test("Test logout", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .send({ refreshToken: userRefreshToken });
    expect(response.statusCode).toBe(200);
  });

  test("Test user roles", async () => {
    const response = await request(app)
      .get("/auth/userRoles")
      .set("Authorization", "JWT " + userAccessToken);
    expect(response.statusCode).toBe(200);
  });
});
