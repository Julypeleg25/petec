import { getEmptyFormData } from "../../../components/Patients/SavePatient/utils/savePatientForm.utils";
import { CLINICA_ROUTES, CLINICA_TEXTS } from "../constants/clinica.constants";
import type { ClinicaClient, ClinicaPet } from "../types/clinicaClient.types";
import type { ClinicaNewPatientState } from "../types/clinicaNewPatient.types";

const MAX_RECORD_TEXT_LENGTH = 420;

const trimRecordText = (value: string): string =>
  value.length > MAX_RECORD_TEXT_LENGTH
    ? `${value.slice(0, MAX_RECORD_TEXT_LENGTH)}...`
    : value;

const toNumberValue = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const numberValue = Number(value.replace(",", "."));

  return Number.isFinite(numberValue) ? numberValue : undefined;
};

const toIntegerValue = (value?: string): number | undefined => {
  const numberValue = toNumberValue(value);

  return numberValue !== undefined &&
    Number.isInteger(numberValue) &&
    numberValue >= 0
    ? numberValue
    : undefined;
};

const extractWeightKg = (text: string): number | undefined => {
  const match =
    text.match(/(?:משקל|weight|wt)[^\d]{0,80}(\d+(?:[.,]\d+)?)/i) ??
    text.match(/(\d+(?:[.,]\d+)?)\s*(?:קילו|קג|ק"ג|ק״ג|kg)/i);

  return toNumberValue(match?.[1]);
};

const extractAge = (
  text: string,
): Pick<ClinicaPet, "ageYears" | "ageMonths"> => {
  const decimalYearsMatch =
    text.match(/(?:גיל|שנים|שנה|years|year)[^\d]{0,80}(\d+(?:[.,]\d+))/i) ??
    text.match(/(\d+(?:[.,]\d+)?)\s*(?:שנים|שנה|years|year)/i);
  const decimalYears = toNumberValue(decimalYearsMatch?.[1]);

  if (decimalYears !== undefined && !Number.isInteger(decimalYears)) {
    const ageYears = Math.floor(decimalYears);
    const ageMonths = Math.round((decimalYears - ageYears) * 12);

    return {
      ageYears,
      ageMonths: ageMonths <= 11 ? ageMonths : undefined,
    };
  }

  const yearsMatch =
    text.match(/(?:גיל\s*\(?שנים\)?|שנים|שנה|years|year)[^\d]{0,80}(\d+)/i) ??
    text.match(/(\d+)\s*(?:שנים|שנה|years|year)/i);
  const monthsMatch =
    text.match(/(?:גיל\s*\(?חודשים\)?|חודשים|חודש|months|month)[^\d]{0,80}(\d+)/i) ??
    text.match(/(\d+)\s*(?:חודשים|חודש|months|month)/i);
  const ageYears = toIntegerValue(yearsMatch?.[1]);
  const rawMonths = toIntegerValue(monthsMatch?.[1]);

  if (ageYears === undefined && rawMonths !== undefined && rawMonths > 11) {
    return {
      ageYears: Math.floor(rawMonths / 12),
      ageMonths: rawMonths % 12,
    };
  }

  const ageMonths =
    rawMonths !== undefined && rawMonths <= 11 ? rawMonths : undefined;

  return {
    ageYears,
    ageMonths,
  };
};

const extractPetDetailsFromRecords = (
  client: ClinicaClient,
): Pick<ClinicaPet, "weightKg" | "ageYears" | "ageMonths"> => {
  const rawText = (client.rawData?.original?.medicalRecords ?? [])
    .map((record) => record.rawText ?? "")
    .join("\n");

  if (!rawText.trim()) {
    return {};
  }

  return {
    weightKg: extractWeightKg(rawText),
    ...extractAge(rawText),
  };
};

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
  const records = client.rawData?.original?.medicalRecords ?? [];
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

  const recordsWithText = records.filter((record) => record.rawText?.trim());

  if (recordsWithText.length > 0) {
    comments.push("", CLINICA_TEXTS.prefillMedicalRecordsTitle);
    recordsWithText.slice(0, 3).forEach((record) => {
      const recordType = record.recordType ? `${record.recordType}: ` : "";
      comments.push(`${recordType}${trimRecordText(record.rawText?.trim() ?? "")}`);
    });
  }

  return comments.join("\n");
};

export function mapClinicaClientToNewPatientState(
  client: ClinicaClient,
  selectedPet: ClinicaPet,
): ClinicaNewPatientState {
  const rawPatientDetails = getRawPatientDetails(client);
  const fallbackDetails = extractPetDetailsFromRecords(client);

  return {
    source: CLINICA_ROUTES.newPatientSource,
    clinicaClientId: client._id,
    externalPatientId: client.externalPatientId,
    caseId: client.externalPatientId || "",
    name: selectedPet.name,
    ownerName: client.ownerName,
    ownerPhone: client.ownerPhone,
    patientSnapshot: {
      weightKg:
        selectedPet.weightKg ??
        rawPatientDetails.weightKg ??
        fallbackDetails.weightKg,
      ageYears:
        selectedPet.ageYears ??
        rawPatientDetails.ageYears ??
        fallbackDetails.ageYears,
      ageMonths:
        selectedPet.ageMonths ??
        rawPatientDetails.ageMonths ??
        fallbackDetails.ageMonths,
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
