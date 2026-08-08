import { getEmptyFormData } from "../../../components/Patients/SavePatient/utils/savePatientForm.utils";
import { CLINICA_ROUTES, CLINICA_TEXTS } from "../constants/clinica.constants";
import type { ClinicaClient, ClinicaPet } from "../types/clinicaClient.types";
import type { ClinicaNewPatientState } from "../types/clinicaNewPatient.types";

const getRawPatientDetails = (
  client: ClinicaClient,
): Pick<ClinicaPet, "weightKg" | "ageYears" | "ageMonths"> =>
  client.rawData?.original?.patient
    ? {
        weightKg: client.rawData.original.patient.weightKg,
        ageYears: client.rawData.original.patient.ageYears,
        ageMonths: client.rawData.original.patient.ageMonths,
      }
    : {};

const buildClinicaComments = (client: ClinicaClient): string => {
  const labels = CLINICA_TEXTS.prefillCommentLabels;
  const comments: string[] = [
    CLINICA_TEXTS.prefillCommentsTitle,
    `${labels.clinicaCaseId}: ${client.externalPatientId ?? "-"}`,
    `${labels.ownerName}: ${client.ownerName}`,
    `${labels.ownerPhone}: ${client.ownerPhone}`,
  ];

  if (client.pets.length > 1) {
    comments.push(`${labels.relatedPets}: ${client.pets.map((pet) => pet.name).join(", ")}`);
  }

  return comments.join("\n");
};

export function mapClinicaClientToNewPatientState(
  client: ClinicaClient,
  selectedPet: ClinicaPet,
): ClinicaNewPatientState {
  const rawPatientDetails = getRawPatientDetails(client);

  return {
    source: CLINICA_ROUTES.newPatientSource,
    clinicaClientId: client._id,
    externalPatientId: client.externalPatientId,
    caseId: client.externalPatientId || "",
    name: selectedPet.name,
    ownerName: client.ownerName,
    ownerPhone: client.ownerPhone,
    patientSnapshot: {
      weightKg: selectedPet.weightKg ?? rawPatientDetails.weightKg,
      ageYears: selectedPet.ageYears ?? rawPatientDetails.ageYears,
      ageMonths: selectedPet.ageMonths ?? rawPatientDetails.ageMonths,
      gender: selectedPet.gender,
      breed: selectedPet.breed,
      species: selectedPet.species,
      color: selectedPet.color,
      insurance: selectedPet.insurance,
      treatingDoctor: selectedPet.treatingDoctor,
      referringDoctor: selectedPet.referringDoctor,
    },
    pets: client.pets,
    comments: buildClinicaComments(client),
  };
}

export function mapClinicaStateToNewPatientFormData(
  state: ClinicaNewPatientState,
) {
  const emptyFormData = getEmptyFormData();

  return {
    ...emptyFormData,
    caseId: state.caseId,
    name: state.name,
    owner: {
      name: state.ownerName,
      phone: state.ownerPhone,
    },
    admission: {
      ...emptyFormData.admission,
      referringDoctor: state.patientSnapshot.referringDoctor ?? "",
    },
    patientSnapshot: {
      ageYears: state.patientSnapshot.ageYears,
      ageMonths: state.patientSnapshot.ageMonths,
      weightKg: state.patientSnapshot.weightKg,
    },
    comments: state.comments ?? "",
  };
}
