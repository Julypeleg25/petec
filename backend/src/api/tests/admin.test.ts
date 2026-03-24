import { Express } from "express";
import request from "supertest";
import initApp from "../../config/app";
import { AppDataSource } from "../../config/typeORM";
import AuthService from "../services/AuthService";
import AdminService from "../services/AdminService";
import logger from "../utils/Logger";
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

const userRole = {
  id: 0,
  name: "ADMIN",
};

let adminAccessToken: string;

beforeAll(async () => {
  logger.info("start admin beforeAll");
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

  logger.info("end admin beforeAll");
});

afterAll(async () => {
  logger.info("start admin afterAll");

  await deleteAllDBTablesData();
  await AppDataSource.destroy();

  logger.info("end admin afterAll");
});

describe("admin tests", () => {
  // Animal type
  test("Test get all animal types with 0 types in db", async () => {
    const response = await request(app)
      .get("/admin/animalType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test post new animal type", async () => {
    const response = await request(app)
      .post("/admin/animalType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "cat" });
    expect(response.statusCode).toBe(200);
  });

  test("Test post new animal type with an existing name", async () => {
    const response = await request(app)
      .post("/admin/animalType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "cat" });
    expect(response.statusCode).toBe(500);
  });

  test("Test get all animal with one type in db", async () => {
    const response = await request(app)
      .get("/admin/animalType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test edit animal type with existing name", async () => {
    const response = await request(app)
      .put("/admin/animalType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: "cat" });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit animal type with incorrect id", async () => {
    const response = await request(app)
      .put("/admin/animalType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: "dog" });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit animal type", async () => {
    const response = await request(app)
      .get("/admin/animalType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const type = response.body.find(
      (animalType: any) => animalType.name === "cat"
    );
    const response2 = await request(app)
      .put("/admin/animalType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: type.id, name: "dog" });
    expect(response2.statusCode).toBe(200);
    expect(response2.body.name).toBe("dog");
  });

  test("Test delete animal type with incorrect id", async () => {
    const response = await request(app)
      .delete("/admin/animalType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test delete animal type", async () => {
    const response = await request(app)
      .get("/admin/animalType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const type = response.body.find(
      (animalType: any) => animalType.name === "dog"
    );
    const response2 = await request(app)
      .delete("/admin/animalType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: type.id });
    expect(response2.statusCode).toBe(200);
  });

  // Race type

  test("Test get all race types with 0 races in db", async () => {
    const response = await request(app)
      .get("/admin/raceType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Test post new race type", async () => {
    const response = await request(app)
      .post("/admin/animalType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Dog" });

    const animalTypeId = response.body.id;

    const response2 = await request(app)
      .post("/admin/raceType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Rottweiler", animalTypeId: animalTypeId });
    expect(response2.statusCode).toBe(200);
  });

  test("Test post new race type with an existing name", async () => {
    const response = await request(app)
      .post("/admin/raceType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Rottweiler", animalTypeId: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test post new race type with an incorrect animal id", async () => {
    const response = await request(app)
      .post("/admin/raceType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Pug", animalTypeId: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test get all race types with one type in db", async () => {
    const response = await request(app)
      .get("/admin/raceType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test get race types by id", async () => {
    const response1 = await request(app)
      .get("/admin/raceType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const raceType = response1.body[0];
    const response = await request(app)
      .get(`/admin/raceType/allByAnimalId/${raceType.animalType.id}`)
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test edit race type with incorrect race type", async () => {
    const response1 = await request(app)
      .get("/admin/animalType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const animalTypeId = response1.body.find(
      (animalType: any) => animalType.name === "Dog"
    );

    const response2 = await request(app)
      .get("/admin/raceType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const type = response2.body.find(
      (raceType: any) => raceType.name === "Rottweiler"
    );

    const response = await request(app)
      .put("/admin/raceType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: type.name, animalTypeId: animalTypeId.id });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit race type with incorrect race id", async () => {
    const response1 = await request(app)
      .get("/admin/animalType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const animalTypeId = response1.body.find(
      (animalType: any) => animalType.name === "Dog"
    );

    const response2 = await request(app)
      .get("/admin/raceType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const type = response2.body.find(
      (raceType: any) => raceType.name === "Rottweiler"
    );

    const response = await request(app)
      .put("/admin/raceType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: "Pug", animalTypeId: animalTypeId.id });
    expect(response.statusCode).toBe(500);
  });
  test("Test edit race type with incorrect animal id", async () => {
    const response1 = await request(app)
      .get("/admin/animalType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const animalTypeId = response1.body.find(
      (animalType: any) => animalType.name === "Dog"
    );

    const response2 = await request(app)
      .get("/admin/raceType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const type = response2.body.find(
      (raceType: any) => raceType.name === "Rottweiler"
    );

    const response = await request(app)
      .put("/admin/raceType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: type.id, name: "Pug", animalTypeId: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit race type", async () => {
    const response1 = await request(app)
      .get("/admin/animalType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const animalTypeId = response1.body.find(
      (animalType: any) => animalType.name === "Dog"
    );

    const response2 = await request(app)
      .get("/admin/raceType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const type = response2.body.find(
      (raceType: any) => raceType.name === "Rottweiler"
    );

    const response3 = await request(app)
      .put("/admin/raceType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: type.id, name: "Pug", animalTypeId: animalTypeId.id });
    expect(response3.statusCode).toBe(200);
    expect(response3.body.name).toBe("Pug");
  });

  test("Test delete race type with incorrect id", async () => {
    const response = await request(app)
      .delete("/admin/raceType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test delete race type", async () => {
    const response = await request(app)
      .get("/admin/raceType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const type = response.body.find((raceType: any) => raceType.name === "Pug");
    const response2 = await request(app)
      .delete("/admin/raceType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: type.id });
    expect(response2.statusCode).toBe(200);
  });

  // Animal color

  test("Test get all animal color", async () => {
    const response = await request(app)
      .get("/admin/animalColor/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test post new animal color", async () => {
    const response = await request(app)
      .post("/admin/animalColor/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Black" });
    expect(response.statusCode).toBe(200);
  });

  test("Test post new animal color with an existing name", async () => {
    const response = await request(app)
      .post("/admin/animalColor/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Black" });
    expect(response.statusCode).toBe(500);
  });

  test("Test get all animal colors with one color in db", async () => {
    const response = await request(app)
      .get("/admin/animalColor/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test edit animal color with existing color", async () => {
    const response1 = await request(app)
      .get("/admin/animalColor/all")
      .set("authorization", "JWT " + adminAccessToken);
    const color = response1.body.find(
      (animalType: any) => animalType.name === "Black"
    );

    const response = await request(app)
      .put("/admin/animalColor/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: color.name });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit animal color with incorrect id", async () => {
    const response = await request(app)
      .put("/admin/animalColor/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: "Blue" });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit animal color", async () => {
    const response1 = await request(app)
      .get("/admin/animalColor/all")
      .set("authorization", "JWT " + adminAccessToken);
    const color = response1.body.find(
      (animalType: any) => animalType.name === "Black"
    );

    const response = await request(app)
      .put("/admin/animalColor/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: color.id, name: "Blue" });
    expect(response.statusCode).toBe(200);
  });

  test("Test delete animal color with incorrect id", async () => {
    const response = await request(app)
      .delete("/admin/animalColor/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test delete animal color", async () => {
    const response = await request(app)
      .get("/admin/animalColor/all")
      .set("authorization", "JWT " + adminAccessToken);
    const color = response.body.find(
      (raceType: any) => raceType.name === "Blue"
    );
    const response2 = await request(app)
      .delete("/admin/animalColor/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: color.id });
    expect(response2.statusCode).toBe(200);
  });

  // Feces type

  test("Test get all feces types", async () => {
    const response = await request(app)
      .get("/admin/fecesType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test post new feces type", async () => {
    const response = await request(app)
      .post("/admin/fecesType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Soft" });
    expect(response.statusCode).toBe(200);
  });

  test("Test post new feces type with an existing name", async () => {
    const response = await request(app)
      .post("/admin/fecesType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Soft" });
    expect(response.statusCode).toBe(500);
  });

  test("Test get all feces type with one type in db", async () => {
    const response = await request(app)
      .get("/admin/fecesType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test edit feces type with existing name", async () => {
    const response1 = await request(app)
      .get("/admin/fecesType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const fecesType = response1.body.find(
      (fecesType: any) => fecesType.name === "Soft"
    );

    const response = await request(app)
      .put("/admin/fecesType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: fecesType.name });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit feces type with incorrect id", async () => {
    const response = await request(app)
      .put("/admin/fecesType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: "Hard" });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit feces type", async () => {
    const response1 = await request(app)
      .get("/admin/fecesType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const fecesType = response1.body.find(
      (animalType: any) => animalType.name === "Soft"
    );

    const response = await request(app)
      .put("/admin/fecesType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: fecesType.id, name: "Hard" });
    expect(response.statusCode).toBe(200);
  });

  test("Test delete feces type with incorrect id", async () => {
    const response = await request(app)
      .delete("/admin/fecesType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test delete feces type", async () => {
    const response = await request(app)
      .get("/admin/fecesType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const fecesType = response.body.find(
      (fecesType: any) => fecesType.name === "Hard"
    );
    const response2 = await request(app)
      .delete("/admin/fecesType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: fecesType.id });
    expect(response2.statusCode).toBe(200);
  });

  // Food type

  test("Test get all food types", async () => {
    const response = await request(app)
      .get("/admin/foodType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test post new food type", async () => {
    const response = await request(app)
      .post("/admin/foodType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Bonzo" });
    expect(response.statusCode).toBe(200);
  });

  test("Test post new food type with an existing name", async () => {
    const response = await request(app)
      .post("/admin/foodType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Bonzo" });
    expect(response.statusCode).toBe(500);
  });

  test("Test get all food type with one type in db", async () => {
    const response = await request(app)
      .get("/admin/foodType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test edit food type with existing name", async () => {
    const response1 = await request(app)
      .get("/admin/foodType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const fecesType = response1.body.find(
      (fecesType: any) => fecesType.name === "Bonzo"
    );

    const response = await request(app)
      .put("/admin/foodType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: fecesType.name });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit food type with incorrect id", async () => {
    const response = await request(app)
      .put("/admin/foodType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: "Bones" });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit food type", async () => {
    const response1 = await request(app)
      .get("/admin/foodType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const fecesType = response1.body.find(
      (animalType: any) => animalType.name === "Bonzo"
    );

    const response = await request(app)
      .put("/admin/foodType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: fecesType.id, name: "Bones" });
    expect(response.statusCode).toBe(200);
  });

  test("Test delete food type with incorrect id", async () => {
    const response = await request(app)
      .delete("/admin/foodType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test delete food type", async () => {
    const response = await request(app)
      .get("/admin/foodType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const foodType = response.body.find(
      (fecesType: any) => fecesType.name === "Bones"
    );
    const response2 = await request(app)
      .delete("/admin/foodType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: foodType.id });
    expect(response2.statusCode).toBe(200);
  });

  // Gender type

  test("Test get all gender types", async () => {
    const response = await request(app)
      .get("/admin/genderType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test post new gender type", async () => {
    const response = await request(app)
      .post("/admin/genderType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Male" });
    expect(response.statusCode).toBe(200);
  });

  test("Test post new gender type with an existing name", async () => {
    const response = await request(app)
      .post("/admin/genderType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Male" });
    expect(response.statusCode).toBe(500);
  });

  test("Test get all gender type with one type in db", async () => {
    const response = await request(app)
      .get("/admin/genderType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test edit gender type with existing name", async () => {
    const response1 = await request(app)
      .get("/admin/genderType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const genderType = response1.body.find(
      (genderType: any) => genderType.name === "Male"
    );

    const response = await request(app)
      .put("/admin/genderType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: genderType.name });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit gender type with incorrect id", async () => {
    const response = await request(app)
      .put("/admin/genderType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: "Female" });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit gender type", async () => {
    const response1 = await request(app)
      .get("/admin/genderType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const genderType = response1.body.find(
      (animalType: any) => animalType.name === "Male"
    );

    const response = await request(app)
      .put("/admin/genderType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: genderType.id, name: "Female" });
    expect(response.statusCode).toBe(200);
  });

  test("Test delete gender type with incorrect id", async () => {
    const response = await request(app)
      .delete("/admin/genderType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test delete gender type", async () => {
    const response = await request(app)
      .get("/admin/genderType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const genderType = response.body.find(
      (genderType: any) => genderType.name === "Female"
    );
    const response2 = await request(app)
      .delete("/admin/genderType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: genderType.id });
    expect(response2.statusCode).toBe(200);
  });

  // Urine type

  test("Test get all urine types", async () => {
    const response = await request(app)
      .get("/admin/urineType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test post new urine type", async () => {
    const response = await request(app)
      .post("/admin/urineType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Yellow" });
    expect(response.statusCode).toBe(200);
  });

  test("Test post new urine type with an existing name", async () => {
    const response = await request(app)
      .post("/admin/urineType/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Yellow" });
    expect(response.statusCode).toBe(500);
  });

  test("Test get all urine type with one type in db", async () => {
    const response = await request(app)
      .get("/admin/urineType/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test edit urine type with existing name", async () => {
    const response1 = await request(app)
      .get("/admin/urineType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const urineType = response1.body.find(
      (urineType: any) => urineType.name === "Yellow"
    );

    const response = await request(app)
      .put("/admin/urineType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: urineType.name });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit urine type with incorrect id", async () => {
    const response = await request(app)
      .put("/admin/urineType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1, name: "Transparent" });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit urine type", async () => {
    const response1 = await request(app)
      .get("/admin/urineType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const urineType = response1.body.find(
      (urineType: any) => urineType.name === "Yellow"
    );

    const response = await request(app)
      .put("/admin/urineType/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: urineType.id, name: "Transparent" });
    expect(response.statusCode).toBe(200);
  });

  test("Test delete urine type with incorrect id", async () => {
    const response = await request(app)
      .delete("/admin/urineType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test delete urine type", async () => {
    const response = await request(app)
      .get("/admin/urineType/all")
      .set("authorization", "JWT " + adminAccessToken);
    const urineType = response.body.find(
      (urineType: any) => urineType.name === "Transparent"
    );
    const response2 = await request(app)
      .delete("/admin/urineType/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: urineType.id });
    expect(response2.statusCode).toBe(200);
  });

  // Users

  test("Test edit user with incorrect id", async () => {
    const user = await AuthService.findByUsername(adminUser.username);
    const response = await request(app)
      .put("/admin/user/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: -1,
        username: user?.username,
        email: "systemAdmin@gmail.com",
        firstName: "Edited first name",
        lastName: user?.lastName,
        roleId: user?.userRole.id,
      });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit user with incorrect role id", async () => {
    const user = await AuthService.findByUsername(adminUser.username);
    const response = await request(app)
      .put("/admin/user/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: user?.id,
        username: user?.username,
        email: "systemAdmin@gmail.com",
        firstName: "Edited first name",
        lastName: user?.lastName,
        roleId: -1,
      });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit user with email that already existed", async () => {
    const user = await AuthService.findByUsername(adminUser.username);
    const response = await request(app)
      .put("/admin/user/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: (user?.id ?? 0) + 1,
        username: user?.username,
        email: "systemAdmin@gmail.com",
        firstName: "Edited first name",
        lastName: user?.lastName,
        roleId: user?.userRole.id,
      });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit user with adminUsername that already existed", async () => {
    const user = await AuthService.findByUsername(adminUser.username);
    const response = await request(app)
      .put("/admin/user/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: (user?.id ?? 0) + 1,
        username: user?.username,
        email: "differentMail@gmail.com",
        firstName: "Edited first name",
        lastName: user?.lastName,
        roleId: user?.userRole.id,
      });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit user", async () => {
    const user = await AuthService.findByUsername(adminUser.username);
    const response = await request(app)
      .put("/admin/user/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: user?.id,
        username: user?.username,
        email: "systemAdmin@gmail.com",
        firstName: "Edited first name",
        lastName: user?.lastName,
        roleId: user?.userRole.id,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.firstName).toBe("Edited first name");

    // Revert to the original user
    const response2 = await request(app)
      .put("/admin/user/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: user?.id,
        adminUsername: adminUser.username,
        email: "systemAdmin@gmail.com",
        firstName: user?.firstName,
        lastName: user?.lastName,
        roleId: user?.userRole.id,
      });
  });

  test("Test delete user with incorrect id", async () => {
    const response = await request(app)
      .delete("/admin/user/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1 });
    expect(response.statusCode).toBe(500);
  });

  // Medicine

  test("Test post new medicine", async () => {
    const medicineCategoryId = (
      await AdminService.newMedicineCategory("Antibiotics")
    ).id;
    const unitTypeId = (await AdminService.newUnitType("ml")).id;

    const response = await request(app)
      .post("/admin/medicine/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        name: "Nurofen",
        unit: unitTypeId,
        categoryId: medicineCategoryId,
      });
    expect(response.statusCode).toBe(200);
  });

  test("Test post new medicine with an existing name", async () => {
    const response = await request(app)
      .post("/admin/medicine/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Nurofen", unit: 1, categoryId: 1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test post new medicine with incorrect category", async () => {
    const response = await request(app)
      .post("/admin/medicine/new")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ name: "Advil", unit: 1, categoryId: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test get all medicines", async () => {
    const response = await request(app)
      .get("/medicine/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test get all medicines with invalid token", async () => {
    const invalidToken = "invalidToken123";
    const response = await request(app)
      .get("/medicine/all")
      .set("authorization", "JWT " + invalidToken);
    expect(response.statusCode).toBe(401);
  });

  test("Test get medicines routes for administration", async () => {
    const response = await request(app)
      .get("/medicine/medicinesRoutesForAdministration")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test get medicines routes for administration with missing token", async () => {
    const response = await request(app).get(
      "/medicine/medicinesRoutesForAdministration"
    );
    expect(response.statusCode).toBe(401);
  });

  test("Test get all medicine with one type in db", async () => {
    const response = await request(app)
      .get("/medicine/all")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("Test get all medicine category types", async () => {
    const response = await request(app)
      .get("/medicine/getAllCategoryTypes")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test get all medicine category types with missing token", async () => {
    const response = await request(app).get("/medicine/getAllCategoryTypes");
    expect(response.statusCode).toBe(401);
  });

  test("Test get medicines frequencies", async () => {
    const response = await request(app)
      .get("/medicine/medicinesFrequencies")
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test get medicines frequencies with invalid token", async () => {
    const invalidToken = "invalidToken123";
    const response = await request(app)
      .get("/medicine/medicinesFrequencies")
      .set("authorization", "JWT " + invalidToken);
    expect(response.statusCode).toBe(401);
  });
  test("Test get all medicines by category type", async () => {
    const categoryId = 1; // Replace with an actual category ID
    const response = await request(app)
      .get(`/medicine/getAllByCategoryType/${categoryId}`)
      .set("authorization", "JWT " + adminAccessToken);
    expect(response.statusCode).toBe(200);
  });

  test("Test edit medicine with existing name", async () => {
    const response1 = await request(app)
      .get("/medicine/all")
      .set("authorization", "JWT " + adminAccessToken);
    const medicine = response1.body.find(
      (medicine: any) => medicine.name === "Nurofen"
    );

    const response = await request(app)
      .put("/admin/medicine/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: -1,
        name: medicine.name,
        unit: medicine.unit.id,
        categoryId: medicine.category.id,
      });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit medicine with incorrect id", async () => {
    const response1 = await request(app)
      .get("/medicine/all")
      .set("authorization", "JWT " + adminAccessToken);
    const medicine = response1.body.find(
      (medicine: any) => medicine.name === "Nurofen"
    );

    const response = await request(app)
      .put("/admin/medicine/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: -1,
        name: "Advil",
        unit: medicine.unit.id,
        categoryId: medicine.category.id,
      });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit medicine with incorrect category id", async () => {
    const response1 = await request(app)
      .get("/medicine/all")
      .set("authorization", "JWT " + adminAccessToken);
    const medicine = response1.body.find(
      (medicine: any) => medicine.name === "Nurofen"
    );

    const response = await request(app)
      .put("/admin/medicine/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: medicine.id,
        name: "Advil",
        unit: medicine.unit.id,
        categoryId: -1,
      });
    expect(response.statusCode).toBe(500);
  });

  test("Test edit medicine", async () => {
    const response1 = await request(app)
      .get("/medicine/all")
      .set("authorization", "JWT " + adminAccessToken);
    const medicine = response1.body.find(
      (medicine: any) => medicine.name === "Nurofen"
    );

    const response = await request(app)
      .put("/admin/medicine/edit")
      .set("authorization", "JWT " + adminAccessToken)
      .send({
        id: medicine.id,
        name: "Advil",
        unit: medicine.unit.id,
        categoryId: medicine.category.id,
      });
    expect(response.statusCode).toBe(200);
  });

  test("Test delete medicine with incorrect id", async () => {
    const response = await request(app)
      .delete("/admin/medicine/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: -1 });
    expect(response.statusCode).toBe(500);
  });

  test("Test delete medicine", async () => {
    const response = await request(app)
      .get("/medicine/all")
      .set("authorization", "JWT " + adminAccessToken);
    const medicine = response.body.find(
      (medicine: any) => medicine.name === "Advil"
    );
    const response2 = await request(app)
      .delete("/admin/medicine/delete")
      .set("authorization", "JWT " + adminAccessToken)
      .send({ id: medicine.id });
    expect(response2.statusCode).toBe(200);
  });
});
