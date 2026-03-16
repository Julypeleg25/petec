import type { IAnimalVitals } from "@models/lookups";

type VitalRowLike = Readonly<{
  dateTime: Date | string;
  temperature?: number | null;
  pulse?: number | null;
  respiration?: number | null;
}>;

export const ANIMAL_VITAL_TYPES = {
  TEMPERATURE: "T",
  PULSE: "P",
  RESPIRATION: "R",
} as const;

export type LatestVitalRows<TRow extends VitalRowLike> = Readonly<{
  TRow: TRow | null;
  PRow: TRow | null;
  RRow: TRow | null;
}>;

export const buildAnimalVitalsMap = (
  animalVitals: ReadonlyArray<IAnimalVitals>,
): Record<string, IAnimalVitals> => {
  const vitalsMap: Record<string, IAnimalVitals> = {};

  animalVitals.forEach((vital) => {
    if (vital.vitalsType) {
      vitalsMap[vital.vitalsType] = vital;
    }
  });

  return vitalsMap;
};

export const getLatestVitalRows = <TRow extends VitalRowLike>(
  rows: ReadonlyArray<TRow>,
): LatestVitalRows<TRow> => {
  const vitalsData: {
    TRow: TRow | null;
    PRow: TRow | null;
    RRow: TRow | null;
  } = {
    TRow: null,
    PRow: null,
    RRow: null,
  };

  let tempFound = false;
  let pulseFound = false;
  let respirationFound = false;

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];

    if (row.temperature !== undefined && row.temperature !== null && !tempFound) {
      tempFound = true;
      vitalsData.TRow = row;
    }

    if (row.pulse !== undefined && row.pulse !== null && !pulseFound) {
      pulseFound = true;
      vitalsData.PRow = row;
    }

    if (
      row.respiration !== undefined &&
      row.respiration !== null &&
      !respirationFound
    ) {
      respirationFound = true;
      vitalsData.RRow = row;
    }
  }

  return vitalsData;
};

export const isValueInRange = (
  value: number | undefined | null,
  min: number | undefined,
  max: number | undefined,
): boolean => {
  if (value === undefined || value === null || min === undefined || max === undefined) {
    return true;
  }

  return value >= min && value <= max;
};
