export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const cloneCells = <T extends object>(cells: T[]): T[] =>
  cells.map((cell) => ({ ...cell }));

export const toOptionalText = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const toOptionalNumber = (
  value?: string | number | null,
): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsedValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsedValue)) {
    return undefined;
  }
  return parsedValue;
};
