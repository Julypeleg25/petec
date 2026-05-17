/**
 * PETEC pg_dump (.pgsql, COPY format) -> MongoDB Seeder (Petec V2 schema)
 *
 * Goals:
 * - Use the NEW Petec V2 document design
 * - Preserve ALL business data from the dump by mapping every legacy column into a V2 field
 *   (no raw row blobs, but we DO include additional V2 fields where the dump has data)
 * - Robust date parsing for Postgres date/timestamp formats
 *
 * Usage:
 *   node petec_pgsql_to_mongo_seed.js --input ./PETEC-SCRIPT.pgsql --mongo mongodb://localhost:27017 --db petec
 *
 * Options:
 *   --dry    Parse + build docs and print counts, but DO NOT connect/insert.
 *
 * Requirements:
 *   npm i mongodb
 */
const fs = require("fs");
const readline = require("readline");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dry: false, mult: 1 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--input") out.input = args[++i];
    else if (a === "--mongo") out.mongo = args[++i];
    else if (a === "--db") out.db = args[++i];
    else if (a === "--dry") out.dry = true;
    else if (a === "--mult") out.mult = Math.max(1, Number(args[++i] ?? 1) || 1);
  }
  if (!out.input) throw new Error("Missing --input <path-to-pgsql>");
  if (!out.dry) {
    if (!out.mongo) throw new Error("Missing --mongo <mongodb-uri>");
    if (!out.db) throw new Error("Missing --db <db-name>");
  }
  return out;
}

function unescapeCopyValue(v) {
  if (v === "\\N") return null;
  if (v == null) return null;
  return String(v)
    .replace(/\\\\/g, "\\")
    .replace(/\\t/g, "\t")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r");
}

function toBool(v) {
  if (v == null) return null;
  const s = String(v).toLowerCase();
  if (s === "t" || s === "true" || s === "1") return true;
  if (s === "f" || s === "false" || s === "0") return false;
  return null;
}
function toNumber(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Robust Postgres date/timestamp parser.
 * Supports:
 * - YYYY-MM-DD
 * - YYYY-MM-DD HH:mm:ss
 * - YYYY-MM-DD HH:mm:ss.SSSSSS
 * - ISO strings
 */
function toDate(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;

  // Date only
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T00:00:00.000Z");
    return Number.isFinite(d.getTime()) ? d : null;
  }

  // Timestamp without TZ: "YYYY-MM-DD HH:mm:ss[.fraction]"
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d{1,6})?$/);
  if (m) {
    const frac = (m[3] || ".000").slice(1);
    const ms = (frac + "000").slice(0, 3); // micros -> ms
    const d = new Date(`${m[1]}T${m[2]}.${ms}Z`);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  // Fallback to JS parse (ISO w/ TZ etc)
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toDateOnlyString(v) {
  const parsed = toDate(v);
  if (!parsed) return null;
  return parsed.toISOString().slice(0, 10);
}

function normalizeTimeString(v) {
  if (v == null) return "";
  const s = String(v).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return s;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function toUtcDateTime(dateStr, timeStr) {
  const safeDate = String(dateStr || "1970-01-01").slice(0, 10);
  const safeTime = normalizeTimeString(timeStr || "00:00") || "00:00";
  const [y, m, d] = safeDate.split("-").map(Number);
  const [hh, mm] = safeTime.split(":").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0));
}

function parseFoodAndWaterFlags(v) {
  if (v == null) return { foodGiven: undefined, waterGiven: undefined };
  const text = String(v).toLowerCase();
  const hasFood = text.includes("food") || text.includes("אוכל");
  const hasWater = text.includes("water") || text.includes("מים");
  return {
    foodGiven: hasFood ? true : undefined,
    waterGiven: hasWater ? true : undefined,
  };
}

function normalizeTableName(schema, table) {
  const t = table.replace(/^"|"$/g, "");
  return `${schema}.${t}`;
}

function newObjectIdString() {
  return crypto.randomBytes(12).toString("hex"); // 24 hex
}

const DEFAULT_ANESTHESIA_FORM_TEXTS = [
  "חומרי הרדמה נחשבים בטוחים, עם זאת תמיד קיים סיכון בהרדמה ובפרוצדרות כירורגיות, ולרופא/מרפאה אין יכולת לחזות או לקחת אחריות במידה ולבעל החיים תהייה תגובה שלילית להרדמה.",
  "בחתימה על מסמך זה הנני מסכים/ה לביצוע ההרדמה והפרצדורות הכירורגיות הנדרשות בחירום או על פי תיאום מראש, זאת לאחר שהוסברו לי כלל הסיכונים הכרוכים בכך.",
  "הנני מאשר שהובא לידיעתי הערכת מחיר זו וכי ידוע לי שעשויה להיות סטייה של עד 15% מהערכה זו. במידה ובמהלך הטיפול התעורר צורך בטיפולים נוספים שיגרמו למחיר לעלות ביותר מ 15%, כי אז יעדכן הרופא טלפונית לקבלת אישורי.",
  "הנני מתחייב להסדיר את התשלום לפי הערכת המחיר הנ\"ל, עם שחרור בעל החיים מהמרפאה. אני מבין ומודע לכך כי עלי להסדיר את התשלום, גם במידה ובעל החיים ימות במהלך הטיפול/אישפוז. אני מאשר כי קראתי, הוסבר לי והבנתי את הסיכונים.",
  "אני מודע לכך שהאישפוז אינו כולל השגחת לילה.\nבמידה ובעל החיים נשאר לאישפוז לילה, אני מודע לכך שאין צוות רפואי נוכח בלילה.",
];

function makeIdMap() {
  /** @type {Record<string, Map<string, string>>} */
  const idMap = {};
  return {
    get(schemaTable, legacyId) {
      if (legacyId == null) return null;
      if (!idMap[schemaTable]) idMap[schemaTable] = new Map();
      const m = idMap[schemaTable];
      const k = String(legacyId);
      let oid = m.get(k);
      if (!oid) {
        oid = newObjectIdString();
        m.set(k, oid);
      }
      return oid;
    },
  };
}

async function parsePgDumpCopyBlocks(inputPath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  /** @type {Record<string, {cols: string[], rows: any[]}>} */
  const tables = {};
  const copyRe = /^COPY\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_"]+)\s+\(([^)]+)\)\s+FROM\s+stdin;/;

  let current = null; // { key, cols }
  for await (const line of rl) {
    if (!current) {
      const m = line.match(copyRe);
      if (m) {
        const schema = m[1];
        const table = m[2];
        const cols = m[3].split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        const key = normalizeTableName(schema, table);
        tables[key] = tables[key] || { cols, rows: [] };
        current = { key, cols };
      }
      continue;
    }
    if (line === "\\.") {
      current = null;
      continue;
    }
    const parts = line.split("\t").map(unescapeCopyValue);
    const obj = {};
    for (let i = 0; i < current.cols.length; i++) obj[current.cols[i]] = parts[i] ?? null;
    tables[current.key].rows.push(obj);
  }
  return tables;
}

function buildV2Docs(tables) {
  const idMap = makeIdMap();
  const getRows = (t) => (tables[t]?.rows || []);

  // Legacy tables (actual names from your dump)
  const T = {
    patient: "petec.patient",
    case: "petec.case",
    user: "petec.user",
    master_case: "petec.master_case",
    master_case_cases: "petec.master_case_cases",
    anesthesia: "petec.anesthesia_procedure_form",
    audit: "petec.audit_log",
    patient_document: "petec.patient_document",
    patient_document_type: "petec.patient_document_type",
    case_daily_details: "petec.case_daily_details",
    cdd_meds: "petec.case_daily_details_medicines",
    cdd_procs: "petec.case_daily_details_procedures",
    cdd_food: "petec.case_daily_details_food_extras",
    cdd_exams: "petec.case_daily_details_examinations",

    case_meds: "petec.case_medicines",
    case_procs: "petec.case_procedures",
    case_food: "petec.case_food_extras",
    case_exams: "petec.case_examinations",
    patient_medicine: "petec.patient_medicine",

    // lookups
    animal_type: "petec.animal_type",
    race_type: "petec.race_type",
    animal_color: "petec.animal_color",
    gender_type: "petec.gender_type",
    insurance_type: "petec.insurance_type",
    food_type: "petec.food_type",
    food_extra_type: "petec.food_extra_type",
    examination_type: "petec.examination_type",
    feces_type: "petec.feces_type",
    urine_type: "petec.urine_type",
    dosage_frequency: "petec.dosage_frequency",
    measure_unit: "petec.measure_unit_types",
    procedure_type: "petec.procedure_type",
    medicine: "petec.medicine",
    medicine_category: "petec.medicine_category",
    roa: "petec.route_of_administration",
    animal_vitals: "petec.animal_vitals",

    user_role: "petec.user_role",
    user_privilege: "petec.user_privilege",
    role_priv: "petec.user_role_user_privilege",
  };

  const getMappedRefId = (legacyValue, targetTable) =>
    legacyValue != null ? idMap.get(targetTable, legacyValue) : undefined;

  const mapLegacyTaxonomyRefs = (row, fallbackRefs = {}) => ({
    animalTypeId:
      getMappedRefId(row.animal_id ?? row.animal_type_id, T.animal_type) ?? fallbackRefs.animalTypeId,
    genderTypeId:
      getMappedRefId(row.gender_id ?? row.gender_type_id, T.gender_type) ?? fallbackRefs.genderTypeId,
    raceTypeId:
      getMappedRefId(row.race_id ?? row.race_type_id, T.race_type) ?? fallbackRefs.raceTypeId,
    animalColorId:
      getMappedRefId(row.animal_color_id ?? row.color_id, T.animal_color) ?? fallbackRefs.animalColorId,
    foodTypeId:
      getMappedRefId(row.food_type_id ?? row.food_id, T.food_type) ?? fallbackRefs.foodTypeId,
    insuranceTypeId:
      getMappedRefId(row.insurance_id ?? row.insurance_type_id, T.insurance_type) ?? fallbackRefs.insuranceTypeId,
  });

  /** @type {Record<string, any[]>} */
  const out = {
    users: [],
    patients: [],
    cases: [],
    master_cases: [],
    anesthesia_forms: [],
    patient_documents: [],
    patient_medicines: [],
    audit_logs: [],
    animal_types: [],
    race_types: [],
    animal_colors: [],
    animal_vitals: [],
    gender_types: [],
    insurance_types: [],
    food_types: [],
    food_extra_types: [],
    examination_types: [],
    feces_types: [],
    urine_types: [],
    dosage_frequencies: [],
    measure_unit_types: [],
    procedure_types: [],
    medicines: [],
    medicine_categories: [],
    routes_of_administration: [],
    anesthesia_form_texts: [],
    patient_document_types: [],
  };

  // Lookups (ensure we keep createdAt from dump)
  const lookupMap = [
    [T.animal_type, "animal_types"],
    [T.race_type, "race_types"],
    [T.animal_color, "animal_colors"],
    [T.animal_vitals, "animal_vitals"],
    [T.gender_type, "gender_types"],
    [T.insurance_type, "insurance_types"],
    [T.food_type, "food_types"],
    [T.food_extra_type, "food_extra_types"],
    [T.examination_type, "examination_types"],
    [T.feces_type, "feces_types"],
    [T.urine_type, "urine_types"],
    [T.dosage_frequency, "dosage_frequencies"],
    [T.measure_unit, "measure_unit_types"],
    [T.procedure_type, "procedure_types"],
    [T.medicine_category, "medicine_categories"],
    [T.medicine, "medicines"],
    [T.roa, "routes_of_administration"],
    [T.patient_document_type, "patient_document_types"],
  ];

  for (const [legacyTable, outName] of lookupMap) {
    const rows = getRows(legacyTable);
    out[outName] = rows.map((r) => {
      const legacyId = r.id ?? r.ID ?? r.Id;
      const doc = {
        _id: idMap.get(legacyTable, legacyId),
        serialId: legacyId != null ? String(legacyId) : undefined,
        name: r.name ?? r.title ?? r.value ?? r.type ?? r.description ?? null,
        description: r.description ?? undefined,
        isDeleted:
          r.is_deleted != null
            ? (toBool(r.is_deleted) ?? false)
            : false,
        createdAt: toDate(r.created_at) ?? undefined,
        updatedAt: toDate(r.updated_at) ?? undefined,
      };
      if (legacyTable === T.race_type) {
        const raceAnimalTypeId = r.animal_type_id ?? r.animal_id;
        if (raceAnimalTypeId != null) doc.animalTypeId = idMap.get(T.animal_type, raceAnimalTypeId);
      }
      
      if (legacyTable === T.medicine_category) {
        const n = (doc.name ?? "").toString().trim().toLowerCase();
        // Exact mapping from old Petec categories (from PETEC-SCRIPT.pgsql):
        // תרופות -> MEDICINE, נוזלים -> FLUID, תוספות לנוזלים -> FLUID_EXTRA
        if (n === "תרופות") doc.type = "medicine";
        else if (n === "נוזלים") doc.type = "fluid";
        else if (n === "תוספות לנוזלים") doc.type = "fluidExtra";
        else doc.type = null;
      }
if (legacyTable === T.medicine) {
        // petec.medicine columns (pgsql): category_id, measure_unit_id, range_min, range_max, total_dose, comments, route_of_administration_id, dosage_frequency_id
        if (r.category_id != null && r.category_id !== "\N") doc.categoryId = idMap.get(T.medicine_category, r.category_id);
        if (r.measure_unit_id != null && r.measure_unit_id !== "\N") doc.measureUnitTypeId = idMap.get(T.measure_unit, r.measure_unit_id);
        if (r.dosage_frequency_id != null && r.dosage_frequency_id !== "\N") doc.dosageFrequencyId = idMap.get(T.dosage_frequency, r.dosage_frequency_id);
        if (r.route_of_administration_id != null && r.route_of_administration_id !== "\N") doc.routeOfAdministrationId = idMap.get(T.roa, r.route_of_administration_id);
        if (r.range_min != null && r.range_min !== "\N" && String(r.range_min).trim() !== "") doc.rangeMin = toNumber(r.range_min) ?? r.range_min;
        if (r.range_max != null && r.range_max !== "\N" && String(r.range_max).trim() !== "") doc.rangeMax = toNumber(r.range_max) ?? r.range_max;
        if (r.total_dose != null && r.total_dose !== "\N" && String(r.total_dose).trim() !== "") doc.totalDose = toNumber(r.total_dose) ?? r.total_dose;
        if (r.comments != null && r.comments !== "\N" && String(r.comments).trim() !== "") doc.comments = r.comments;
      }
      if (legacyTable === T.animal_vitals) {
        const vitalsAnimalTypeId = r.animal_id ?? r.animal_type_id;
        if (vitalsAnimalTypeId != null) doc.animalTypeId = idMap.get(T.animal_type, vitalsAnimalTypeId);
        if (r.vitals_type != null) doc.vitalsType = r.vitals_type; // 'T','P','R'
        if (r.range_min != null) doc.rangeMin = toNumber(r.range_min) ?? r.range_min;
        if (r.range_max != null) doc.rangeMax = toNumber(r.range_max) ?? r.range_max;
      }
      return doc;
    });
  }

  out.anesthesia_form_texts = DEFAULT_ANESTHESIA_FORM_TEXTS.map((text, index) => ({
    _id: newObjectIdString(),
    serialId: String(index + 1),
    name: text,
    isDeleted: false,
  }));

  // Validate medicine reference migrations (no defaults): if SQL had a non-null FK, Mongo must have a non-null ObjectId
  const sqlMeds = getRows(T.medicine);
  const countNonNull = (rows, key) => rows.filter((r) => r[key] != null && r[key] !== "\N" && String(r[key]).trim() !== "").length;
  const countDocNonNull = (docs, key) => docs.filter((d) => d[key] != null).length;

  const expectedCategory = countNonNull(sqlMeds, "category_id");
  const expectedUnit = countNonNull(sqlMeds, "measure_unit_id");
  const expectedFreq = countNonNull(sqlMeds, "dosage_frequency_id");
  const expectedRoa = countNonNull(sqlMeds, "route_of_administration_id");

  const gotCategory = countDocNonNull(out.medicines, "categoryId");
  const gotUnit = countDocNonNull(out.medicines, "measureUnitTypeId");
  const gotFreq = countDocNonNull(out.medicines, "dosageFrequencyId");
  const gotRoa = countDocNonNull(out.medicines, "routeOfAdministrationId");

  const mismatches = [];
  if (expectedCategory !== gotCategory) mismatches.push(`categoryId expected ${expectedCategory} got ${gotCategory}`);
  if (expectedUnit !== gotUnit) mismatches.push(`measureUnitTypeId expected ${expectedUnit} got ${gotUnit}`);
  if (expectedFreq !== gotFreq) mismatches.push(`dosageFrequencyId expected ${expectedFreq} got ${gotFreq}`);
  if (expectedRoa !== gotRoa) mismatches.push(`routeOfAdministrationId expected ${expectedRoa} got ${gotRoa}`);

  if (mismatches.length) {
    console.error("Medicine migration validation failed:", mismatches.join("; "));
    // Print a few offending rows for debugging
    const sample = sqlMeds.slice(0, 10).map((r) => ({
      id: r.id,
      category_id: r.category_id,
      measure_unit_id: r.measure_unit_id,
      dosage_frequency_id: r.dosage_frequency_id,
      route_of_administration_id: r.route_of_administration_id,
    }));
    console.error("SQL medicine sample:", sample);
    throw new Error("Medicine reference IDs were not migrated correctly (see logs).");
  }

  // Users (dump: created_by etc naming)
  const roleById = new Map(getRows(T.user_role).map((rr) => [String(rr.id), rr]));
  const privById = new Map(getRows(T.user_privilege).map((pp) => [String(pp.id), pp]));
  const privsByRoleId = new Map();
  for (const rp of getRows(T.role_priv)) {
    const rid = String(rp.user_role_id);
    const pid = String(rp.user_privilege_id);
    const arr = privsByRoleId.get(rid) || [];
    const p = privById.get(pid);
    if (p) arr.push(p.name ?? p.code ?? pid);
    privsByRoleId.set(rid, arr);
  }

  for (const r of getRows(T.user)) {
    const legacyId = r.id;
    const doc = {
      _id: idMap.get(T.user, legacyId),
      serialId: legacyId != null ? String(legacyId) : undefined,
      username: r.username ?? undefined,
      firstName: r.first_name ?? undefined,
      lastName: r.last_name ?? undefined,
      email: r.email ?? (r.username ? `${r.username}@local` : `user_${legacyId}@local`),
      passwordHash: r.password ?? r.password_hash ?? null,
      role: "ASSISTANT",
      privileges: [],
      status: toBool(r.is_deleted) === true ? "INACTIVE" : "ACTIVE",
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
      __legacyRoleId: r.role_id ?? r.user_role_id ?? null,
    };
    out.users.push(doc);
  }

  for (const u of out.users) {
    const roleId = u.__legacyRoleId;
    if (roleId != null) {
      const rr = roleById.get(String(roleId));
      const roleName = (rr?.name ?? "").toUpperCase();
      if (roleName.includes("ADMIN")) u.role = "ADMIN";
      else if (roleName.includes("DOCTOR") || roleName.includes("VET") || roleName.includes("רופא")) u.role = "DOCTOR";
      else if (roleName.includes("NURSE") || roleName.includes("ASSIST") || roleName.includes("אחות")) u.role = "ASSISTANT";
      else if (roleName.includes("RECEPTION") || roleName.includes("קבלה")) u.role = "RECEPTION";
      else u.role = "ASSISTANT";
      u.privileges = privsByRoleId.get(String(roleId)) || [];
    }
    delete u.__legacyRoleId;
  }

  // Patients (dump contains many refs; keep them)
  const patientRefsByLegacyPatientId = new Map();
  for (const r of getRows(T.patient)) {
    const legacyId = r.id;
    const patientRefs = mapLegacyTaxonomyRefs(r);
    out.patients.push({
      _id: idMap.get(T.patient, legacyId),
      serialId: legacyId != null ? String(legacyId) : undefined,
      name: r.name ?? null,
      owner: {
        name: r.owner_name ?? null,
        phone: r.owner_phone_number ?? null,
      },
      photoName: r.photo_name ?? null,
      refs: patientRefs,
      createdByUserId: r.created_by != null ? idMap.get(T.user, r.created_by) : undefined,
      updatedByUserId: r.updated_by != null ? idMap.get(T.user, r.updated_by) : undefined,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    });
    if (legacyId != null) {
      patientRefsByLegacyPatientId.set(String(legacyId), patientRefs);
    }
  }

  // Cases
  const caseDocByLegacyId = new Map();
  for (const r of getRows(T.case)) {
    const legacyCaseId = r.id;
    const patientFallbackRefs =
      r.patient_id != null ? patientRefsByLegacyPatientId.get(String(r.patient_id)) : undefined;
    const doc = {
      _id: idMap.get(T.case, legacyCaseId),
      serialId: legacyCaseId != null ? String(legacyCaseId) : undefined,
      patientId: r.patient_id != null ? idMap.get(T.patient, r.patient_id) : null,
      masterCaseId: null,

      createdByUserId: r.created_by != null ? idMap.get(T.user, r.created_by) : undefined,
      updatedByUserId: r.updated_by != null ? idMap.get(T.user, r.updated_by) : undefined,
      doctorUserId: r.doctor_id != null ? idMap.get(T.user, r.doctor_id) : undefined,
      nurseUserId: r.nurse_id != null ? idMap.get(T.user, r.nurse_id) : undefined,
      releasedByUserId: r.released_by != null ? idMap.get(T.user, r.released_by) : undefined,

      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
      releaseDate: toDate(r.release_date) ?? undefined,

      isArchived: toBool(r.is_archived) ?? false,
      isDeleted: toBool(r.is_deleted) ?? false,

      admission: {
        hospitalizationReason: r.hospitalization_reason ?? null,
        referringDoctor: r.referring_doctor ?? null,
        allergicComments: r.allergic_comments ?? null,
        bloodTestLink: r.blood_test_link ?? null,
      },
      patientSnapshot: {
        ageYears: toNumber(r.age_years) ?? undefined,
        ageMonths: toNumber(r.age_months) ?? undefined,
        weightKg: toNumber(r.weight_kg) ?? undefined,
      },
      flags: {
        isAllergic: toBool(r.is_allergic) ?? undefined,
        isEscapePotential: toBool(r.is_escape_potential) ?? undefined,
        isNPO: toBool(r.is_npo) ?? undefined,
        isRiskAnesthesia: toBool(r.is_risk_anesthesia) ?? undefined,
        isHeartMurmur: toBool(r.is_heart_murmur) ?? undefined,
        isAMB: toBool(r.is_amb) ?? undefined,
        isAggressive: toBool(r.is_aggressive) ?? undefined,
        isConvenia: toBool(r.is_convenia) ?? undefined,
        isCerenia: toBool(r.is_cerenia) ?? undefined,
        isProcedure: toBool(r.is_procedure) ?? undefined,
      },
      dates: {
        catheterDate: toDate(r.catheter_date) ?? undefined,
        procedureDate: toDate(r.procedure_date) ?? undefined,
        nextInspectionDate: toDate(r.next_inspection_date) ?? undefined,
        stitchesRemovalDate: toDate(r.stitches_removal_date) ?? undefined,
      },
      refs: mapLegacyTaxonomyRefs(r, patientFallbackRefs),
      comments: r.comments ?? null,
      dailyPlan: {
        comments: r.daily_plan_comments ?? null,
        updatedAt: toDate(r.daily_plan_comments_created_at) ?? undefined,
      },

      caseDetailsGrid: [],
    };
    out.cases.push(doc);
    caseDocByLegacyId.set(String(legacyCaseId), doc);
  }

  // Master cases + link
  const masterDocByLegacyId = new Map();
  for (const r of getRows(T.master_case)) {
    const legacyId = r.id;
    const doc = {
      _id: idMap.get(T.master_case, legacyId),
      serialId: legacyId != null ? String(legacyId) : undefined,
      patientId: r.patient_id != null ? idMap.get(T.patient, r.patient_id) : undefined,
      caseIds: [],
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    };
    out.master_cases.push(doc);
    masterDocByLegacyId.set(String(legacyId), doc);
  }
  for (const r of getRows(T.master_case_cases)) {
    const mc = masterDocByLegacyId.get(String(r.master_case_id));
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (mc && c) {
      mc.caseIds.push(c._id);
      c.masterCaseId = mc._id;
    }
  }

  // Case-level detail definitions live in case_* tables in this dump.
  // In V2 the canonical migrated shape is caseDetailsGrid plus patientMedicines,
  // so we keep these as intermediate maps and validate that every definition is
  // represented in the daily-detail link tables before inserting.
  const caseMedicineById = new Map();
  const medicineDocById = new Map(out.medicines.map((item) => [String(item._id), item]));
  for (const r of getRows(T.case_meds)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;
    const medicineId = r.medicine_id != null ? idMap.get(T.medicine, r.medicine_id) : undefined;
    const medicineDoc = medicineId ? medicineDocById.get(String(medicineId)) : undefined;
    const item = {
      _id: idMap.get(T.case_meds, r.id),
      medicineId,
      doseAmount: r.dose_amount ?? null,
      dosageText: r.dosage ?? null, // not present in this dump; keep for forward compatibility
      measureUnitTypeId: medicineDoc?.measureUnitTypeId ?? undefined,
      dosageFrequencyId: r.frequency_id != null ? idMap.get(T.dosage_frequency, r.frequency_id) : undefined,
      routeOfAdministrationId: r.route_of_administration_id != null ? idMap.get(T.roa, r.route_of_administration_id) : undefined,
      isMedicine: r.is_medicine != null ? toBool(r.is_medicine) : undefined,
      createdByUserId: r.created_by != null ? idMap.get(T.user, r.created_by) : undefined,
      updatedByUserId: r.updated_by != null ? idMap.get(T.user, r.updated_by) : undefined,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    };
    caseMedicineById.set(String(r.id), item);
  }

  const caseProcedureById = new Map();
  for (const r of getRows(T.case_procs)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;
    const item = {
      _id: idMap.get(T.case_procs, r.id),
      procedureTypeId: r.procedure_id != null ? idMap.get(T.procedure_type, r.procedure_id) : undefined,
      createdByUserId: r.created_by != null ? idMap.get(T.user, r.created_by) : undefined,
      updatedByUserId: r.updated_by != null ? idMap.get(T.user, r.updated_by) : undefined,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    };
    caseProcedureById.set(String(r.id), item);
  }

  const caseFoodById = new Map();
  for (const r of getRows(T.case_food)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;
    const item = {
      _id: idMap.get(T.case_food, r.id),
      foodExtraTypeId: r.food_extra_id != null ? idMap.get(T.food_extra_type, r.food_extra_id) : undefined,
      createdByUserId: r.created_by != null ? idMap.get(T.user, r.created_by) : undefined,
      updatedByUserId: r.updated_by != null ? idMap.get(T.user, r.updated_by) : undefined,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    };
    caseFoodById.set(String(r.id), item);
  }

  const caseExamById = new Map();
  for (const r of getRows(T.case_exams)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;
    const item = {
      _id: idMap.get(T.case_exams, r.id),
      examinationTypeId: r.examination_id != null ? idMap.get(T.examination_type, r.examination_id) : undefined,
      createdByUserId: r.created_by != null ? idMap.get(T.user, r.created_by) : undefined,
      updatedByUserId: r.updated_by != null ? idMap.get(T.user, r.updated_by) : undefined,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    };
    caseExamById.set(String(r.id), item);
  }

  const assertAllCaseDefinitionsAreLinked = (label, definitionMap, linkRows, linkKey) => {
    const linkedIds = new Set(
      linkRows
        .map((row) => row[linkKey])
        .filter((value) => value != null)
        .map((value) => String(value)),
    );
    const orphanedIds = [...definitionMap.keys()].filter((id) => !linkedIds.has(id));

    if (orphanedIds.length > 0) {
      throw new Error(
        `${label} migration would lose ${orphanedIds.length} case-level rows without daily-detail links. Sample legacy ids: ${orphanedIds
          .slice(0, 10)
          .join(", ")}`,
      );
    }
  };

  assertAllCaseDefinitionsAreLinked(
    "Medicines/fluids",
    caseMedicineById,
    getRows(T.cdd_meds),
    "case_medicines_id",
  );
  assertAllCaseDefinitionsAreLinked(
    "Procedures",
    caseProcedureById,
    getRows(T.cdd_procs),
    "case_procedures_id",
  );
  assertAllCaseDefinitionsAreLinked(
    "Food extras",
    caseFoodById,
    getRows(T.cdd_food),
    "case_food_extras_id",
  );
  assertAllCaseDefinitionsAreLinked(
    "Examinations",
    caseExamById,
    getRows(T.cdd_exams),
    "case_examinations_id",
  );

  const medicineNameById = new Map(out.medicines.map((item) => [String(item._id), item.name ?? ""]));
  const procedureNameById = new Map(out.procedure_types.map((item) => [String(item._id), item.name ?? ""]));
  const foodExtraNameById = new Map(out.food_extra_types.map((item) => [String(item._id), item.name ?? ""]));
  const examinationNameById = new Map(out.examination_types.map((item) => [String(item._id), item.name ?? ""]));

  // Daily grid rows
  const dailyById = new Map();
  const rawDailyRowsByCase = new Map();
  for (const r of getRows(T.case_daily_details)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;

    const normalizedDate = toDateOnlyString(r.date) ?? String(r.date ?? "").slice(0, 10);
    const normalizedTime = normalizeTimeString(r.time);
    const actualDateTime = toUtcDateTime(normalizedDate, normalizedTime);
    const foodAndWaterFlags = parseFoodAndWaterFlags(r.food_and_water);

    const row = {
      index: 0,
      date: normalizedDate,
      time: normalizedTime,
      dateTime: actualDateTime,

      temperature: toNumber(r.temp) ?? undefined,
      temperatureIsRequired: toBool(r.temp_is_required) ?? undefined,
      temperatureIsEditable: toBool(r.temp_is_editable) ?? undefined,

      pulse: toNumber(r.pulse) ?? undefined,
      pulseIsRequired: toBool(r.pulse_is_required) ?? undefined,
      pulseIsEditable: toBool(r.pulse_is_editable) ?? undefined,

      respiration: toNumber(r.respiration) ?? undefined,
      respirationIsRequired: toBool(r.respiration_is_required) ?? undefined,
      respirationIsEditable: toBool(r.respiration_is_editable) ?? undefined,

      urineTypeId: r.urine_type_id != null ? idMap.get(T.urine_type, r.urine_type_id) : undefined,
      urineComments: r.urine_comments ?? undefined,
      urineIsRequired: toBool(r.urine_is_required) ?? undefined,
      urineIsEditable: toBool(r.urine_is_editable) ?? undefined,

      fecesTypeId: r.feces_type_id != null ? idMap.get(T.feces_type, r.feces_type_id) : undefined,
      fecesComments: r.feces_comments ?? undefined,
      fecesIsRequired: toBool(r.feces_is_required) ?? undefined,
      fecesIsEditable: toBool(r.feces_is_editable) ?? undefined,

      isBoxClean: toBool(r.is_box_clean) ?? undefined,
      isBoxCleanIsRequired: toBool(r.is_box_clean_is_required) ?? undefined,
      isBoxCleanIsEditable: toBool(r.is_box_clean_is_editable) ?? undefined,

      isRelease: toBool(r.is_release) ?? undefined,
      isReleaseIsRequired: toBool(r.is_release_is_required) ?? undefined,
      isReleaseIsEditable: toBool(r.is_release_is_editable) ?? undefined,

      isTravel: toBool(r.is_walk_trip) ?? undefined,
      isTravelIsRequired: toBool(r.is_walk_trip_is_required) ?? undefined,
      isTravelIsEditable: toBool(r.is_walk_trip_is_editable) ?? undefined,

      isPuke: toBool(r.is_puke) ?? undefined,
      pukeComments: r.puke_comments ?? undefined,
      pukeIsRequired: toBool(r.puke_is_required) ?? undefined,
      pukeIsEditable: toBool(r.puke_is_editable) ?? undefined,

      weigh: toNumber(r.weigh) ?? undefined,
      weighIsRequired: toBool(r.weigh_is_required) ?? undefined,
      weighIsEditable: toBool(r.weigh_is_editable) ?? undefined,

      rowComments: r.comments ?? undefined,
      rowCommentsIsRequired: toBool(r.comments_is_required) ?? undefined,
      rowCommentsIsEditable: toBool(r.comments_is_editable) ?? undefined,

      ownerUpdate: r.owner_update ?? undefined,
      ownerUpdateIsRequired: toBool(r.owner_update_is_required) ?? undefined,
      ownerUpdateIsEditable: toBool(r.owner_update_is_editable) ?? undefined,

      foodGiven: foodAndWaterFlags.foodGiven,
      waterGiven: foodAndWaterFlags.waterGiven,
      foodAndWater: r.food_and_water ?? null,
      foodAndWaterIsRequired: false,
      foodAndWaterIsEditable: true,

      fluids: [],
      medicines: [],
      procedures: [],
      examinations: [],
      foodExtras: [],
    };

    dailyById.set(String(r.id), row);
    if (!rawDailyRowsByCase.has(String(r.case_id))) rawDailyRowsByCase.set(String(r.case_id), []);
    rawDailyRowsByCase.get(String(r.case_id)).push({
      caseDoc: c,
      legacyId: String(r.id),
      createdAt: toDate(r.created_at),
      actualDateTime,
      row,
    });
  }

  for (const [legacyCaseId, rawRows] of rawDailyRowsByCase.entries()) {
    const caseDoc = caseDocByLegacyId.get(legacyCaseId);
    if (!caseDoc) continue;

    rawRows.sort((a, b) => {
      const dt = a.actualDateTime.getTime() - b.actualDateTime.getTime();
      if (dt !== 0) return dt;
      const ca = a.createdAt ? a.createdAt.getTime() : 0;
      const cb = b.createdAt ? b.createdAt.getTime() : 0;
      if (ca !== cb) return ca - cb;
      return a.legacyId.localeCompare(b.legacyId);
    });

    let sheetStartIndex = 0;
    while (sheetStartIndex < rawRows.length) {
      const sheetRows = rawRows.slice(sheetStartIndex, sheetStartIndex + 13);
      const sheetDate = sheetRows[0]?.actualDateTime.toISOString().slice(0, 10) ?? "1970-01-01";
      for (let i = 0; i < sheetRows.length; i++) {
        const item = sheetRows[i];
        item.row.index = i;
        item.row.date = sheetDate;
      }
      sheetStartIndex += 13;
    }

    caseDoc.caseDetailsGrid.push(...rawRows.map((item) => item.row));
  }

  // Daily medicines: link to case_medicines
  for (const r of getRows(T.cdd_meds)) {
    const row = dailyById.get(String(r.case_daily_details_id));
    if (!row) continue;
    const base = caseMedicineById.get(String(r.case_medicines_id));
    if (!base || !base.medicineId) continue;

    const medicineCell = {
      medicineId: base.medicineId,
      name: medicineNameById.get(String(base.medicineId)) || undefined,
      dosageText: base.dosageText ?? undefined,
      doseAmount: toNumber(base.doseAmount) ?? undefined,
      measureUnitTypeId: base.measureUnitTypeId ?? undefined,
      dosageFrequencyId: base.dosageFrequencyId ?? undefined,
      routeOfAdministrationId: base.routeOfAdministrationId ?? undefined,
      isGiven: toBool(r.is_given) ?? undefined,
      isRequired: toBool(r.is_required) ?? false,
      isEditable: toBool(r.is_editable) ?? true,
      comment: r.comment ?? undefined,
    };

    if (base.isMedicine === false) row.fluids.push(medicineCell);
    else row.medicines.push(medicineCell);
  }
  for (const r of getRows(T.cdd_procs)) {
    const row = dailyById.get(String(r.case_daily_details_id));
    if (!row) continue;
    const base = caseProcedureById.get(String(r.case_procedures_id));
    if (!base || !base.procedureTypeId) continue;
    row.procedures.push({
      typeId: base.procedureTypeId,
      name: procedureNameById.get(String(base.procedureTypeId)) || undefined,
      isGiven: toBool(r.is_given) ?? undefined,
      isRequired: toBool(r.is_required) ?? false,
      isEditable: toBool(r.is_editable) ?? true,
      comment: r.comment ?? undefined,
    });
  }
  for (const r of getRows(T.cdd_food)) {
    const row = dailyById.get(String(r.case_daily_details_id));
    if (!row) continue;
    const base = caseFoodById.get(String(r.case_food_extras_id));
    if (!base || !base.foodExtraTypeId) continue;
    row.foodExtras.push({
      typeId: base.foodExtraTypeId,
      name: foodExtraNameById.get(String(base.foodExtraTypeId)) || undefined,
      isGiven: toBool(r.is_given) ?? undefined,
      isRequired: toBool(r.is_required) ?? false,
      isEditable: toBool(r.is_editable) ?? true,
      comment: r.comment ?? undefined,
    });
  }
  for (const r of getRows(T.cdd_exams)) {
    const row = dailyById.get(String(r.case_daily_details_id));
    if (!row) continue;
    const base = caseExamById.get(String(r.case_examinations_id));
    if (!base || !base.examinationTypeId) continue;
    row.examinations.push({
      typeId: base.examinationTypeId,
      name: examinationNameById.get(String(base.examinationTypeId)) || undefined,
      value: r.value ?? r.comment ?? null,
      isRequired: toBool(r.is_required) ?? false,
      isEditable: toBool(r.is_editable) ?? true,
      comment: r.comment ?? undefined,
    });
  }

  for (const caseDoc of out.cases) {
    for (const row of caseDoc.caseDetailsGrid) {
      const actualDateTime = row.dateTime instanceof Date && Number.isFinite(row.dateTime.getTime())
        ? row.dateTime
        : toUtcDateTime(row.date, row.time);
      row.dateTime = actualDateTime;
    }
    caseDoc.caseDetailsGrid.sort((a, b) => {
      const dateCompare = String(a.date).localeCompare(String(b.date));
      if (dateCompare !== 0) return dateCompare;
      return (a.index ?? 0) - (b.index ?? 0);
    });
  }

  const seededMedicineCells = out.cases.flatMap((caseDoc) =>
    (caseDoc.caseDetailsGrid ?? []).flatMap((row) => [
      ...(row.fluids ?? []),
      ...(row.medicines ?? []),
    ]),
  );
  const expectedDailyMeasureUnit = getRows(T.cdd_meds).filter((item) => {
    const base = caseMedicineById.get(String(item.case_medicines_id));
    return base?.measureUnitTypeId != null;
  }).length;
  const expectedDailyFrequency = getRows(T.cdd_meds).filter((item) => {
    const base = caseMedicineById.get(String(item.case_medicines_id));
    return base?.dosageFrequencyId != null;
  }).length;
  const expectedDailyRoute = getRows(T.cdd_meds).filter((item) => {
    const base = caseMedicineById.get(String(item.case_medicines_id));
    return base?.routeOfAdministrationId != null;
  }).length;
  const actualDailyMeasureUnit = seededMedicineCells.filter(
    (item) => item.measureUnitTypeId != null,
  ).length;
  const actualDailyFrequency = seededMedicineCells.filter(
    (item) => item.dosageFrequencyId != null,
  ).length;
  const actualDailyRoute = seededMedicineCells.filter(
    (item) => item.routeOfAdministrationId != null,
  ).length;

  const dailyMedicineMismatches = [];
  if (expectedDailyMeasureUnit !== actualDailyMeasureUnit) {
    dailyMedicineMismatches.push(
      `measureUnitTypeId expected ${expectedDailyMeasureUnit} got ${actualDailyMeasureUnit}`,
    );
  }
  if (expectedDailyFrequency !== actualDailyFrequency) {
    dailyMedicineMismatches.push(
      `dosageFrequencyId expected ${expectedDailyFrequency} got ${actualDailyFrequency}`,
    );
  }
  if (expectedDailyRoute !== actualDailyRoute) {
    dailyMedicineMismatches.push(
      `routeOfAdministrationId expected ${expectedDailyRoute} got ${actualDailyRoute}`,
    );
  }

  if (dailyMedicineMismatches.length) {
    throw new Error(
      `Daily medicine reference migration failed: ${dailyMedicineMismatches.join("; ")}`,
    );
  }

  // Release medicines live in patient_medicine in old PETEC and stay in their
  // own collection in V2.
  for (const r of getRows(T.patient_medicine)) {
    const caseDoc = caseDocByLegacyId.get(String(r.case_id));
    if (!caseDoc || !caseDoc.patientId) {
      throw new Error(
        `Release medicine ${String(r.id)} references missing case ${String(r.case_id)}`,
      );
    }

    const medicineId = r.medicine_id != null ? idMap.get(T.medicine, r.medicine_id) : undefined;
    if (!medicineId) {
      throw new Error(
        `Release medicine ${String(r.id)} is missing medicine_id and cannot be migrated`,
      );
    }

    const medicineDoc = medicineDocById.get(String(medicineId));
    out.patient_medicines.push({
      _id: idMap.get(T.patient_medicine, r.id),
      patientId: caseDoc.patientId,
      caseId: caseDoc._id,
      medicineId,
      dosageFrequencyId: r.frequency_id != null ? idMap.get(T.dosage_frequency, r.frequency_id) : undefined,
      routeOfAdministrationId: r.route_of_administration_id != null ? idMap.get(T.roa, r.route_of_administration_id) : undefined,
      measureUnitTypeId: medicineDoc?.measureUnitTypeId ?? undefined,
      doseAmount: toNumber(r.dose_amount) ?? r.dose_amount ?? undefined,
      isDeleted: false,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.created_at) ?? undefined,
    });
  }

  if (out.patient_medicines.length !== getRows(T.patient_medicine).length) {
    throw new Error(
      `Release medicine migration failed: expected ${getRows(T.patient_medicine).length} docs, got ${out.patient_medicines.length}`,
    );
  }

  // Anesthesia forms
  for (const r of getRows(T.anesthesia)) {
    out.anesthesia_forms.push({
      _id: idMap.get(T.anesthesia, r.id),
      caseId: r.case_id != null ? idMap.get(T.case, r.case_id) : undefined,
      ownerName: r.owner_name ?? null,
      name: r.name ?? null,
      date: toDate(r.date) ?? null,
      signature: r.signature ?? null,
      plannedProcedure: r.planned_procedure ?? null,
      priceEstimate: r.price_estimate ?? null,
      isFastSinceMidnight: toBool(r.is_fast_since_midnight) ?? undefined,
      isDistortionHistory: toBool(r.is_distortion_history) ?? undefined,
      isMedicationsSensitive: toBool(r.is_medications_sensitive) ?? undefined,
      isNeedToMarkEar: toBool(r.is_need_to_mark_ear) ?? undefined,
      isSterilization: toBool(r.is_sterilization) ?? undefined,
      isPriceIncludesReleaseMedications: toBool(r.is_price_includes_release_medications) ?? undefined,
      generalComments: r.general_comments ?? null,
      distortionComments: r.distortion_comments ?? null,
      medicationsSensitiveComments: r.medications_sensitive_comments ?? null,
      createdByUserId: r.created_by != null ? idMap.get(T.user, r.created_by) : undefined,
      updatedByUserId: r.updated_by != null ? idMap.get(T.user, r.updated_by) : undefined,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    });
  }

  const expectedAnesthesiaCaseRefs = getRows(T.anesthesia).filter((row) => row.case_id != null).length;
  const actualAnesthesiaCaseRefs = out.anesthesia_forms.filter((row) => row.caseId != null).length;
  if (expectedAnesthesiaCaseRefs !== actualAnesthesiaCaseRefs) {
    throw new Error(
      `Anesthesia form migration failed: expected ${expectedAnesthesiaCaseRefs} case refs, got ${actualAnesthesiaCaseRefs}`,
    );
  }

  // Documents (dump: only case_id + type + document_name)
  for (const r of getRows(T.patient_document)) {
    const caseId = r.case_id != null ? idMap.get(T.case, r.case_id) : undefined;
    // infer patientId from case
    let patientId = undefined;
    if (r.case_id != null) {
      const c = caseDocByLegacyId.get(String(r.case_id));
      patientId = c?.patientId ?? undefined;
    }
    out.patient_documents.push({
      _id: idMap.get(T.patient_document, r.id),
      patientId,
      caseId,
      patientDocumentTypeId: r.patient_document_type != null ? idMap.get(T.patient_document_type, r.patient_document_type) : undefined,
      fileName: r.document_name ?? null,
      storageKey: r.document_name ?? null,
      uploadedByUserId: r.created_by != null ? idMap.get(T.user, r.created_by) : undefined,
      uploadedAt: toDate(r.created_at) ?? undefined,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    });
  }

  // Audit logs (dump has patient_id/case_id)
  for (const r of getRows(T.audit)) {
    const patientId = r.patient_id != null ? idMap.get(T.patient, r.patient_id) : undefined;
    const caseId = r.case_id != null ? idMap.get(T.case, r.case_id) : undefined;
    const entityType = caseId ? "Case" : patientId ? "Patient" : "AuditLog";
    const entityId = caseId ?? patientId ?? idMap.get(T.audit, r.id);

    out.audit_logs.push({
      _id: idMap.get(T.audit, r.id),
      subject: r.subject ?? null,
      description: r.description ?? null,
      entityType,
      entityId,
      performedByUserId: r.created_by != null ? idMap.get(T.user, r.created_by) : undefined,
      createdAt: toDate(r.created_at) ?? undefined,
    });
  }

  // Validation: warn if expected tables are empty
  const expected = [
    [T.patient, "patients"],
    [T.case, "cases"],
    [T.case_daily_details, "case_daily_details"],
  ];
  for (const [tbl, label] of expected) {
    if ((tables[tbl]?.rows?.length ?? 0) === 0) {
      console.warn(`WARNING: legacy table ${tbl} has 0 rows. ${label} may be empty.`);
    }
  }

  return out;
}

function toObjectIdDeep(value, ObjectId, options = {}, parentKey = "") {
  if (value == null) return value;
  if (value instanceof Date) return value;

  if (typeof value === "string" && /^[a-f0-9]{24}$/.test(value)) {
    const keepStringIdKeys = Array.isArray(options.keepStringIdKeys)
      ? options.keepStringIdKeys
      : [];
    const shouldKeepAsString = keepStringIdKeys.includes(parentKey);
    return shouldKeepAsString ? value : new ObjectId(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => toObjectIdDeep(v, ObjectId, options, parentKey));
  }

  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = toObjectIdDeep(v, ObjectId, options, k);
    }
    return out;
  }

  return value;
}

function redactFailingDoc(doc) {
  if (!doc || typeof doc !== "object") return doc;
  const clone = { ...doc };
  if ("signature" in clone) clone.signature = "[REDACTED]";
  if ("passwordHash" in clone) clone.passwordHash = "[REDACTED]";
  return clone;
}

function deepClonePreserveDates(value) {
  if (value == null) return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(deepClonePreserveDates);
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepClonePreserveDates(v);
    return out;
  }
  return value;
}

function remapIdsDeep(value, idMap, parentKey = "") {
  if (value == null) return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) return value.map((v) => remapIdsDeep(v, idMap, parentKey));

  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = remapIdsDeep(v, idMap, k);
    return out;
  }

  if (typeof value === "string" && idMap.has(value)) {
    const isRefKey =
      parentKey === "_id" ||
      parentKey === "id" ||
      parentKey === "caseId" ||
      parentKey === "patientId" ||
      parentKey.endsWith("Id") ||
      parentKey.endsWith("Ids");
    if (isRefKey) return idMap.get(value);
  }
  return value;
}

function expandDataset(docsByCollection, mult) {
  if (!mult || mult <= 1) return docsByCollection;

  // Duplicate only entity collections; keep taxonomy/lookups unchanged.
  const duplicatable = [
    "users",
    "patients",
    "master_cases",
    "cases",
    "anesthesia_forms",
    "patient_documents",
    "patient_medicines",
    "audit_logs",
  ];

  const out = { ...docsByCollection };
  for (const name of duplicatable) out[name] = [...(docsByCollection[name] || [])];
  const base = Object.fromEntries(duplicatable.map((k) => [k, docsByCollection[k] || []]));

  for (let copyIndex = 2; copyIndex <= mult; copyIndex++) {
    const idMap = new Map();

    const allocIds = (docs) => {
      for (const d of docs) {
        if (d?._id) idMap.set(String(d._id), newObjectIdString());
      }
    };

    // Allocate new ids for all duplicated collections (so cross-refs can be remapped).
    for (const name of duplicatable) allocIds(base[name]);

    const cloneAndPush = (collectionName) => {
      for (const src of base[collectionName]) {
        const cloned = deepClonePreserveDates(src);
        const oldId = String(cloned._id);
        cloned._id = idMap.get(oldId) || newObjectIdString();
        if (typeof cloned.serialId === "string" && cloned.serialId.length > 0) {
          cloned.serialId = `${cloned.serialId}-${copyIndex}`;
        }
        const remapped = remapIdsDeep(cloned, idMap);
        out[collectionName].push(remapped);
      }
    };

    for (const name of duplicatable) cloneAndPush(name);
  }

  return out;
}

async function insertAll(client, dbName, docsByCollection) {
  const db = client.db(dbName);
  // Use snake_case collection names
  const toMongoCollectionName = (snake) => snake;
  const order = [
    "animal_types","animal_colors","gender_types","insurance_types","food_types","food_extra_types","examination_types",
    "feces_types","urine_types","dosage_frequencies","measure_unit_types","procedure_types","medicine_categories","medicines",
    "routes_of_administration","race_types","anesthesia_form_texts","patient_document_types","animal_vitals",
    "users","patients","master_cases","cases","anesthesia_forms","patient_documents","patient_medicines","audit_logs"
  ];

  for (const name of order) {
    const docs = docsByCollection[name];
    if (!docs) continue;
    const coll = db.collection(toMongoCollectionName(name));
    if (docs.length === 0) {
      console.log(`skipping ${name} (0 docs)`);
      continue;
    }
    await coll.deleteMany({});
    const batchSize = 1000;
    const keepStringIdKeys =
      name === "audit_logs"
          ? ["entityId"]
          : [];
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize).map((d) =>
        toObjectIdDeep(d, ObjectId, { keepStringIdKeys }),
      );
      try {
        await coll.insertMany(batch, { ordered: false });
      } catch (error) {
        const writeErrors = Array.isArray(error?.writeErrors) ? error.writeErrors : [];
        const firstWriteError = writeErrors.length > 0 ? writeErrors[0] : null;
        const failingDoc = firstWriteError?.err?.op ?? batch[0] ?? null;
        const failingMessage =
          firstWriteError?.errmsg ?? firstWriteError?.err?.errmsg ?? error?.message ?? "insertMany failed";

        console.error("Mongo insert failed", {
          collection: name,
          message: failingMessage,
          failingDocument: redactFailingDoc(failingDoc),
        });
        throw error;
      }
    }
    console.log(`inserted ${docs.length} docs into ${name}`);
  }
}

async function main() {
  const args = parseArgs();
  console.log("Parsing pg_dump COPY blocks...");
  const tables = await parsePgDumpCopyBlocks(args.input);

  console.log("Building Petec V2 documents (V4 full-fidelity mapping)...");
  let docsByCollection = buildV2Docs(tables);

  if (args.mult > 1) {
    console.log(`Expanding dataset: x${args.mult} (duplicating users/patients/cases/etc)...`);
    docsByCollection = expandDataset(docsByCollection, args.mult);
  }

  const counts = Object.fromEntries(Object.entries(docsByCollection).map(([k,v]) => [k, (v?.length ?? 0)]));
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  console.log(`Built ${total} documents`);
  console.log(counts);

  if (args.dry) {
    console.log("--dry specified. Not connecting to Mongo / not inserting.");
    return;
  }

  console.log("Connecting to MongoDB...");
  const client = new MongoClient(args.mongo, { maxPoolSize: 10 });
  await client.connect();
  try {
    await insertAll(client, args.db, docsByCollection);
  } finally {
    await client.close();
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
