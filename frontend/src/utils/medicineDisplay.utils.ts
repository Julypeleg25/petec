export const getMedicineDoseDisplay = (
  doseAmount?: string | number | null,
  measureUnitText?: string | null,
): string | null => {
  const normalizedDose =
    doseAmount !== null && doseAmount !== undefined && `${doseAmount}` !== ""
      ? String(doseAmount)
      : null;

  if (normalizedDose && measureUnitText) {
    return `${normalizedDose}${measureUnitText}`;
  }

  return normalizedDose || measureUnitText || null;
};

export const getMedicineDisplayDetails = (
  doseAmount?: string | number | null,
  measureUnitText?: string | null,
  frequencyText?: string | null,
  routeText?: string | null,
): string => {
  const parts = [
    getMedicineDoseDisplay(doseAmount, measureUnitText),
    frequencyText || null,
    routeText || null,
  ];

  return parts.filter((value): value is string => Boolean(value)).join(" ");
};
