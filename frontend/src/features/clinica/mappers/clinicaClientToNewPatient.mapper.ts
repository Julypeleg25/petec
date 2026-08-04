import { getEmptyFormData } from "../../../components/Patients/SavePatient/utils/savePatientForm.utils";
import { CLINICA_ROUTES, CLINICA_TEXTS } from "../constants/clinica.constants";
import type { ClinicaClient, ClinicaPet } from "../types/clinicaClient.types";
import type { ClinicaNewPatientState } from "../types/clinicaNewPatient.types";
import { normalizeClinicaPetName } from "../utils/clinicaPet.utils";

const MAX_RECORD_TEXT_LENGTH = 420;

const getSelectedPetMedicalRecords = (
  client: ClinicaClient,
  selectedPet: ClinicaPet,
): NonNullable<ClinicaPet["medicalRecords"]> => {
  const directRecords = selectedPet.medicalRecords ?? [];
  const rawPatientName = normalizeClinicaPetName(client.rawData?.original?.patient?.name);
  const selectedPetName = normalizeClinicaPetName(selectedPet.name);
  const legacyRecords = [
    ...(client.rawData?.original?.patient?.medicalRecords ?? []),
    ...(client.rawData?.original?.medicalRecords ?? []),
  ];
  const scopedLegacyRecords = legacyRecords.filter((record) => {
    const recordPatientName = normalizeClinicaPetName(record.patientName);
    if (recordPatientName) return recordPatientName === selectedPetName;
    if (rawPatientName) return rawPatientName === selectedPetName;
    return client.pets.length === 1;
  });

  const seen = new Set<string>();
  return [...directRecords, ...scopedLegacyRecords].filter((record) => {
    const key = JSON.stringify({
      patientName: normalizeClinicaPetName(record.patientName),
      recordType: record.recordType,
      rawText: record.rawText,
      table: record.table,
    });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getValidGender = (value?: string): string | undefined => {
  const cleaned = value?.trim().replace(/\s+/g, " ");
  if (!cleaned) return undefined;
  const normalized = cleaned.toLocaleLowerCase("he-IL");
  const containsMale = /(^|\s)(זכר|male)(\s|$)/i.test(normalized);
  const containsFemale = /(^|\s)(נקבה|female)(\s|$)/i.test(normalized);
  return containsMale && containsFemale ? undefined : cleaned;
};

const getValidBreed = (value?: string): string | undefined => {
  const cleaned = value?.trim().replace(/\s+/g, " ");
  if (!cleaned || /(?:^|\s)(?:מין|gender|sex)\s*:/i.test(cleaned)) {
    return undefined;
  }
  return cleaned;
};

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

type ClinicaRecordFallback = Pick<
  ClinicaPet,
  | "weightKg"
  | "ageYears"
  | "ageMonths"
>;

const extractPetDetailsFromRecords = (
  client: ClinicaClient,
  selectedPet: ClinicaPet,
): ClinicaRecordFallback => {
  const rawText = getSelectedPetMedicalRecords(client, selectedPet)
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
  selectedPet: ClinicaPet,
): Partial<ClinicaPet> =>
  client.rawData?.original?.patient &&
  normalizeClinicaPetName(client.rawData.original.patient.name) ===
    normalizeClinicaPetName(selectedPet.name)
    ? { ...client.rawData.original.patient }
    : {};

const buildClinicaComments = (client: ClinicaClient, selectedPet: ClinicaPet): string => {
  const records = getSelectedPetMedicalRecords(client, selectedPet);
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
  const rawPatientDetails = getRawPatientDetails(client, selectedPet);
  const fallbackDetails = extractPetDetailsFromRecords(client, selectedPet);

  return {
    source: CLINICA_ROUTES.newPatientSource,
    clinicaClientId: client._id,
    externalPatientId: client.externalPatientId,
    caseId: client.externalPatientId ?? "",
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
      gender: getValidGender(selectedPet.gender) ?? getValidGender(rawPatientDetails.gender),
      breed: getValidBreed(selectedPet.breed) ?? getValidBreed(rawPatientDetails.breed),
      species: selectedPet.species ?? rawPatientDetails.species,
      color: selectedPet.color ?? rawPatientDetails.color,
      insurance: selectedPet.insurance ?? rawPatientDetails.insurance,
      treatingDoctor:
        selectedPet.treatingDoctor ?? rawPatientDetails.treatingDoctor,
      referringDoctor:
        selectedPet.referringDoctor ?? rawPatientDetails.referringDoctor,
    },
    pets: client.pets,
    comments: buildClinicaComments(client, selectedPet),
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
