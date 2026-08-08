import type { ClinicaClient, ClinicaPet } from "../types/clinicaClient.types";

export const normalizeClinicaPetName = (value?: string): string =>
  value
    ?.normalize("NFKD")
    .replace(/[\u0591-\u05c7]/g, "")
    .replace(/["'׳״`.,/\\()[\]{}_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("he-IL") ?? "";

export const getClinicaPetKey = (
  client: Pick<ClinicaClient, "_id">,
  pet: ClinicaPet,
): string =>
  `${client._id}:${pet.externalPatientId?.trim() || normalizeClinicaPetName(pet.name)}`;

export const findHydratedClinicaPet = (
  client: ClinicaClient,
  selectedPet: ClinicaPet,
): ClinicaPet | undefined => {
  const selectedExternalId = selectedPet.externalPatientId?.trim();
  if (selectedExternalId) {
    const byExternalId = client.pets.find(
      (pet) => pet.externalPatientId?.trim() === selectedExternalId,
    );
    if (byExternalId) return byExternalId;
  }

  const normalizedName = normalizeClinicaPetName(selectedPet.name);
  if (!normalizedName) return undefined;
  const nameMatches = client.pets.filter(
    (pet) => normalizeClinicaPetName(pet.name) === normalizedName,
  );
  return nameMatches.length === 1 ? nameMatches[0] : undefined;
};
