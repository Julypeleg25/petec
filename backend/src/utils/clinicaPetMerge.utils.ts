import type { ClinicaClientPet } from "../models/clinicaClient/index.js";

type StoredClinicaClientPet = ClinicaClientPet & {
  toObject?: () => ClinicaClientPet;
};

export const toPlainClinicaPets = (
  pets: StoredClinicaClientPet[],
): ClinicaClientPet[] =>
  pets.map((pet) => typeof pet.toObject === "function" ? pet.toObject() : pet);

export const mergePet = (
  existingPet: ClinicaClientPet | undefined,
  incomingPet: ClinicaClientPet,
): ClinicaClientPet => ({
  ...existingPet,
  ...incomingPet,
  gender: incomingPet.gender ?? existingPet?.gender,
  breed: incomingPet.breed ?? existingPet?.breed,
  species: incomingPet.species ?? existingPet?.species,
  color: incomingPet.color ?? existingPet?.color,
  weightKg: incomingPet.weightKg ?? existingPet?.weightKg,
  ageYears: incomingPet.ageYears ?? existingPet?.ageYears,
  ageMonths: incomingPet.ageMonths ?? existingPet?.ageMonths,
  insurance: incomingPet.insurance ?? existingPet?.insurance,
  microchipNumber: incomingPet.microchipNumber ?? existingPet?.microchipNumber,
  neutered: incomingPet.neutered ?? existingPet?.neutered,
  notes: incomingPet.notes ?? existingPet?.notes,
  rawData: incomingPet.rawData ?? existingPet?.rawData,
  treatingDoctor: incomingPet.treatingDoctor ?? existingPet?.treatingDoctor,
  referringDoctor: incomingPet.referringDoctor ?? existingPet?.referringDoctor,
});

export const mergePets = (
  existingPets: ClinicaClientPet[],
  incomingPets: ClinicaClientPet[],
): ClinicaClientPet[] => {
  if (incomingPets.length === 0) {
    return existingPets;
  }

  const mergedPets = [...existingPets];

  for (const incomingPet of incomingPets) {
    const existingPetIndex = mergedPets.findIndex(
      (pet) => pet.name === incomingPet.name,
    );

    if (existingPetIndex >= 0) {
      mergedPets[existingPetIndex] = mergePet(
        mergedPets[existingPetIndex],
        incomingPet,
      );
      continue;
    }

    mergedPets.push(incomingPet);
  }

  return mergedPets;
};
