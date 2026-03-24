import { fakerHE as faker } from "@faker-js/faker"; // Hebrew faker
import { getQueryRunner } from "../../config/typeORM";
import PatientService from "../services/PatientService";

const getRandomBoolean = (): boolean => Math.random() < 0.1;

const getRandomNumber = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getAnimalImage = (animalId: number): string => {
  return animalId === 1
    ? faker.image.urlLoremFlickr({ category: "dogs", width: 400, height: 300 })
    : faker.image.urlLoremFlickr({ category: "cats", width: 400, height: 300 });
};

const doctorIds = [6, 4, 16, 14, 9, 11];
const nurseIds = [8, 5, 15, 13, 10, 18];
const genderIds = [1, 2, 4, 5, 6];
var caseData: { caseId: string; animalTypeId: number }[] = [];

const createMockPatient = async (): Promise<void> => {
  try {
    const caseId = getRandomNumber(1, 10000).toString();
    const animalId = getRandomBoolean() ? 1 : 3;

    const res = await new PatientService().create(
      {
        name: faker.person.firstName(),
        ownerName: faker.person.lastName(),
        ownerPhoneNumber: faker.helpers.fromRegExp(/05[0-9]{8}/),
        insuranceId: getRandomNumber(1, 7),
        hospitalizationReason: faker.lorem.sentence(),
        allergicComments: "",
        weightKg: getRandomNumber(2, 10),
        doctorId: doctorIds[getRandomNumber(0, doctorIds.length - 1)],
        nurseId: nurseIds[getRandomNumber(0, nurseIds.length - 1)],
        referringDoctor: "",
        animalId: animalId,
        genderId: genderIds[getRandomNumber(0, genderIds.length - 1)],
        raceId: null as any,
        caseId: caseId,
        isCerenia: getRandomBoolean(),
        isConvenia: getRandomBoolean(),
        isAllergic: getRandomBoolean(),
        isEscapePotential: getRandomBoolean(),
        isNPO: getRandomBoolean(),
        isRiskAnesthesia: getRandomBoolean(),
        isHeartMurmur: getRandomBoolean(),
        isAMB: getRandomBoolean(),
        isAggressive: getRandomBoolean(),
        ageYears: getRandomNumber(1, 10),
        ageMonths: getRandomNumber(1, 10),
        animalColorId: getRandomNumber(1, 9),
        foodTypeId: getRandomNumber(1, 7),
        catheterDate: null as any,
        procedureDate: null as any,
        isProcedure: getRandomBoolean(),
        bloodTestLink: "",
      },
      null as any,
      { userId: 3, userRole: "ADMIN", userFullName: "ADMIN" } as any
    );

    caseData.push({ caseId: caseId, animalTypeId: animalId });
    console.log(`Patient created`);
  } catch (error) {
    console.error(`Error creating patient: ${error}`);
  }
};

const addImage = async (caseData: { caseId: string; animalTypeId: number }) => {
  let queryRunner;

  try {
    queryRunner = getQueryRunner();
    await queryRunner.connect();

    await queryRunner.query(
      `
          UPDATE petec.patient p
          SET photo_name = $1
          FROM petec.case c
          WHERE p.id = c.patient_id
          AND c.id LIKE $2 || '-%'; 
          `,
      [getAnimalImage(caseData.animalTypeId), caseData.caseId]
    );
  } catch (err: any) {
    console.error(`Failed to add image: ${err.message}`);
  } finally {
    if (queryRunner) await queryRunner.release();
  }
};

export const createMockData = async () => {
  // Create 100 mock patients
  for (let i = 0; i < 100; i++) {
    await createMockPatient();
  }

  for (let i = 0; i < caseData.length; i++) {
    await addImage(caseData[i]);
  }
};
