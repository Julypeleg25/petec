import type { ClinicaClientPet } from "../models/clinicaClient/index.js";

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
  treatingDoctor: incomingPet.treatingDoctor ?? existingPet?.treatingDoctor,
  referringDoctor: incomingPet.referringDoctor ?? existingPet?.referringDoctor,
});

// If incoming is empty (fetch failed, or genuinely no pets this round), keep
// whatever was already known rather than wiping it out.
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
