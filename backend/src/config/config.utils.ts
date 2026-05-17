export const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d|w)$/;

export type DurationUnit = "ms" | "s" | "m" | "h" | "d" | "w";
export type DurationString = `${number}${DurationUnit}`;

export const normalizeDurationString = (value: string): DurationString => {
  const normalizedValue = value.trim().toLowerCase();
  const match = DURATION_PATTERN.exec(normalizedValue);

  if (!match) {
    throw new Error(`Invalid duration value: ${value}`);
  }

  return normalizedValue as DurationString;
};

export const parseDurationToMilliseconds = (value: DurationString): number => {
  const match = DURATION_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Invalid duration value: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as DurationUnit;

  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    case "w":
      return amount * 7 * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
};
