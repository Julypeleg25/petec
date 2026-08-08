import type { SelectOptionObj } from "../../../utils/FormSelect/FormSelect.types";

const LOOKUP_ALIASES: Record<string, string> = {
  dog: "כלב",
  dogs: "כלב",
  canine: "כלב",
  "כלבים": "כלב",
  cat: "חתול",
  cats: "חתול",
  feline: "חתול",
  "חתולים": "חתול",
};

const CLINICA_DETAIL_ALIASES: Record<string, string> = {
  male: "\u05d6\u05db\u05e8",
  man: "\u05d6\u05db\u05e8",
  female: "\u05e0\u05e7\u05d1\u05d4",
  woman: "\u05e0\u05e7\u05d1\u05d4",
  "\u05d6\u05db\u05e8 \u05de\u05e1\u05d5\u05e8\u05e1": "\u05de\u05e1\u05d5\u05e8\u05e1",
  "\u05de\u05e1\u05d5\u05e8\u05e1 \u05d6\u05db\u05e8": "\u05de\u05e1\u05d5\u05e8\u05e1",
  neutered: "\u05de\u05e1\u05d5\u05e8\u05e1",
  castrated: "\u05de\u05e1\u05d5\u05e8\u05e1",
  "\u05e0\u05e7\u05d1\u05d4 \u05de\u05e2\u05d5\u05e7\u05e8\u05ea": "\u05de\u05e2\u05d5\u05e7\u05e8\u05ea",
  "\u05de\u05e2\u05d5\u05e7\u05e8\u05ea \u05e0\u05e7\u05d1\u05d4": "\u05de\u05e2\u05d5\u05e7\u05e8\u05ea",
  spayed: "\u05de\u05e2\u05d5\u05e7\u05e8\u05ea",
};

export const normalizeClinicaLookupText = (value?: string): string => {
  const normalized = value
    ?.normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/["'׳״`´.,/\\()\[\]{}_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("he-IL") ?? "";

  return CLINICA_DETAIL_ALIASES[normalized] ?? LOOKUP_ALIASES[normalized] ?? normalized;
};

export const findClinicaLookupValue = (
  options: readonly SelectOptionObj[],
  clinicaValue?: string,
): string => {
  const normalizedValue = normalizeClinicaLookupText(clinicaValue);
  if (!normalizedValue) return "";

  const normalizedOptions = options.map((option) => ({
    option,
    text: normalizeClinicaLookupText(option.text),
  }));
  const exactMatch = normalizedOptions.find(({ text }) => text === normalizedValue);
  if (exactMatch) return exactMatch.option.value;

  const containedMatches = normalizedOptions.filter(
    ({ text }) =>
      Math.min(text.length, normalizedValue.length) >= 3 &&
      (text.includes(normalizedValue) || normalizedValue.includes(text)),
  );

  return containedMatches.length === 1 ? containedMatches[0].option.value : "";
};
