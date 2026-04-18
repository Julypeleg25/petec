const HEBREW_MARKS_PATTERN = /[\u0591-\u05C7]/g;
const HEBCAL_API_URL = "https://www.hebcal.com/hebcal";

const SPECIAL_CATEGORIES = new Set(["fast", "memorial"]);
const SPECIAL_SUBCATEGORIES = new Set(["fast", "modern"]);

const HEBCAL_QUERY_OPTIONS = {
  v: "1",
  cfg: "json",
  maj: "on",
  min: "on",
  mod: "on",
  nx: "off",
  ss: "off",
  mf: "on",
  c: "off",
  i: "on",
  lg: "h",
} as const;

export type HebcalItem = {
  title: string;
  date: string;
  category: string;
  subcat?: string;
  hebrew?: string;
};

export type HolidayLookup = Map<
  string,
  { holidayLabels: string[]; specialLabels: string[] }
>;

const normalizeHolidayLabel = (label: string): string =>
  label
    .normalize("NFKD")
    .replace(HEBREW_MARKS_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();

export const buildHolidayLookup = (items: HebcalItem[]): HolidayLookup => {
  const lookup: HolidayLookup = new Map();

  for (const item of items) {
    const label = normalizeHolidayLabel(item.hebrew || item.title);
    if (!label) {
      continue;
    }

    if (!lookup.has(item.date)) {
      lookup.set(item.date, { holidayLabels: [], specialLabels: [] });
    }

    const entry = lookup.get(item.date)!;
    const targetLabels =
      SPECIAL_CATEGORIES.has(item.category) ||
      SPECIAL_SUBCATEGORIES.has(item.subcat ?? "")
        ? entry.specialLabels
        : entry.holidayLabels;

    if (!targetLabels.includes(label)) {
      targetLabels.push(label);
    }
  }

  return lookup;
};

export const fetchHebcalMonth = async (
  year: number,
  month: number,
): Promise<HebcalItem[]> => {
  const params = new URLSearchParams({
    ...HEBCAL_QUERY_OPTIONS,
    year: String(year),
    month: String(month),
  });

  try {
    const response = await fetch(`${HEBCAL_API_URL}?${params.toString()}`);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.items ?? []) as HebcalItem[];
  } catch {
    return [];
  }
};
