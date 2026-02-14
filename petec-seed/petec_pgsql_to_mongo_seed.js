/**
 * PETEC pg_dump (.pgsql, COPY format) -> MongoDB Seeder (Petec V2 schema, NO legacy/raw fields stored)
 *
 * Usage:
 *   node petec_pgsql_to_mongo_seed.js --input ./PETEC-SCRIPT.pgsql --mongo mongodb://localhost:27017 --db petec_v2
 *
 * Options:
 *   --dry    Parse + build docs and print counts, but DO NOT connect/insert.
 *
 * Requirements:
 *   npm i mongodb
 */
const fs = require("fs");
const readline = require("readline");
const { ObjectId } = require("mongodb");

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dry: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--input") out.input = args[++i];
    else if (a === "--mongo") out.mongo = args[++i];
    else if (a === "--db") out.db = args[++i];
    else if (a === "--dry") out.dry = true;
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
function toDate(v) {
  if (v == null) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function normalizeTableName(schema, table) {
  const t = table.replace(/^"|"$/g, "");
  return `${schema}.${t}`;
}

function newObjectIdString() {
  // 24 hex chars like Mongo ObjectId (not time-ordered, but valid for seeding).
  const bytes = require("crypto").randomBytes(12);
  return bytes.toString("hex");
}

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
        const cols = m[3].split(",").map((s) => s.trim());
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
    patient_medicine: "petec.patient_medicine",
    case_daily_details: "petec.case_daily_details",
    cdd_meds: "petec.case_daily_details_medicines",
    cdd_procs: "petec.case_daily_details_procedures",
    cdd_food: "petec.case_daily_details_food_extras",
    cdd_exams: "petec.case_daily_details_examinations",
    case_meds: "petec.case_medicines",
    case_procs: "petec.case_procedures",
    case_food: "petec.case_food_extras",
    case_exams: "petec.case_examinations",
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
    patient_document_types: [],
  };

  // Lookups
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
        legacyId: legacyId != null ? Number(legacyId) : undefined,
        name: r.name ?? r.title ?? r.value ?? r.type ?? r.description ?? null,
        isActive: r.is_active != null ? (toBool(r.is_active) ?? true) : true,
        createdAt: toDate(r.created_at) ?? undefined,
        updatedAt: toDate(r.updated_at) ?? undefined,
      };
      if (legacyTable === T.race_type || legacyTable === T.animal_vitals) {
        if (r.animal_type_id != null) doc.animalTypeId = idMap.get(T.animal_type, r.animal_type_id);
      }
      if (legacyTable === T.medicine) {
        if (r.medicine_category_id != null) doc.categoryId = idMap.get(T.medicine_category, r.medicine_category_id);
      }
      if (legacyTable === T.animal_vitals) {
        // keep fields used for notifications ranges if present
        if (r.vitals_type != null) doc.vitalsType = r.vitals_type; // 'T','P','R'
        if (r.range_min != null) doc.rangeMin = toNumber(r.range_min) ?? r.range_min;
        if (r.range_max != null) doc.rangeMax = toNumber(r.range_max) ?? r.range_max;
      }
      if (legacyTable === T.roa) {
        if (r.description != null) doc.description = r.description;
      }
      return doc;
    });
  }

  // Users
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
      legacyId: legacyId != null ? Number(legacyId) : undefined,
      email: r.email ?? (r.username ? `${r.username}@local` : null),
      passwordHash: r.password ?? r.password_hash ?? null,
      role: "ASSISTANT",
      privileges: [],
      status: toBool(r.is_active) === false ? "INACTIVE" : "ACTIVE",
      lastLogin: toDate(r.last_login) ?? undefined,
      refreshTokens: [],
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
      __legacyRoleId: r.user_role_id ?? r.role_id ?? null,
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

  // Patients
  for (const r of getRows(T.patient)) {
    const legacyId = r.id;
    out.patients.push({
      _id: idMap.get(T.patient, legacyId),
      legacyId: legacyId != null ? Number(legacyId) : undefined,
      name: r.name ?? null,
      owner: {
        name: r.owner_name ?? r.ownername ?? null,
        phone: r.owner_phone_number ?? r.ownerphonenumber ?? null,
      },
      photoName: r.photo_name ?? r.photoname ?? null,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    });
  }

  // Cases
  const caseDocByLegacyId = new Map();
  for (const r of getRows(T.case)) {
    const legacyCaseId = r.id;
    const doc = {
      _id: idMap.get(T.case, legacyCaseId),
      legacyCaseId: legacyCaseId != null ? String(legacyCaseId) : undefined,
      patientId: r.patient_id != null ? idMap.get(T.patient, r.patient_id) : null,
      masterCaseId: null,
      createdByUserId: r.created_by_id != null ? idMap.get(T.user, r.created_by_id) : undefined,
      doctorUserId: r.doctor_id != null ? idMap.get(T.user, r.doctor_id) : undefined,
      nurseUserId: r.nurse_id != null ? idMap.get(T.user, r.nurse_id) : undefined,
      releasedByUserId: r.released_by_id != null ? idMap.get(T.user, r.released_by_id) : undefined,
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
      refs: {
        animalTypeId: r.animal_type_id != null ? idMap.get(T.animal_type, r.animal_type_id) : undefined,
        genderTypeId: r.gender_type_id != null ? idMap.get(T.gender_type, r.gender_type_id) : undefined,
        raceTypeId: r.race_type_id != null ? idMap.get(T.race_type, r.race_type_id) : undefined,
        animalColorId: r.animal_color_id != null ? idMap.get(T.animal_color, r.animal_color_id) : undefined,
        insuranceTypeId: r.insurance_type_id != null ? idMap.get(T.insurance_type, r.insurance_type_id) : undefined,
        foodTypeId: r.food_type_id != null ? idMap.get(T.food_type, r.food_type_id) : undefined,
      },
      comments: r.comments ?? null,
      dailyPlan: {
        comments: r.daily_plan_comments ?? null,
        updatedAt: toDate(r.daily_plan_comments_created_at) ?? undefined,
      },
      planned: { medicines: [], procedures: [], foodExtras: [], examinations: [] },
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
      legacyId: legacyId != null ? String(legacyId) : undefined,
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

  // Planned tables
  for (const r of getRows(T.case_meds)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;
    c.planned.medicines.push({
      medicineId: r.medicine_id != null ? idMap.get(T.medicine, r.medicine_id) : undefined,
      dosageText: r.dosage ?? r.dose_text ?? null,
      doseAmount: r.dose_amount ?? null,
      measureUnitTypeId: r.measure_unit_types_id != null ? idMap.get(T.measure_unit, r.measure_unit_types_id) : undefined,
      dosageFrequencyId: r.dosage_frequency_id != null ? idMap.get(T.dosage_frequency, r.dosage_frequency_id) : undefined,
      routeOfAdministrationId: r.route_of_administration_id != null ? idMap.get(T.roa, r.route_of_administration_id) : undefined,
      startDate: toDate(r.start_date) ?? undefined,
      endDate: toDate(r.end_date) ?? undefined,
      isActive: toBool(r.is_active) ?? true,
      notes: r.comments ?? r.note ?? null,
    });
  }
  for (const r of getRows(T.case_procs)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;
    c.planned.procedures.push({
      procedureTypeId: r.procedure_type_id != null ? idMap.get(T.procedure_type, r.procedure_type_id) : undefined,
      plannedProcedureText: r.planned_procedure ?? null,
      scheduledFor: toDate(r.date) ?? undefined,
      priority: r.priority ?? undefined,
      status: r.status ?? "PLANNED",
      notes: r.comments ?? null,
    });
  }
  for (const r of getRows(T.case_food)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;
    c.planned.foodExtras.push({
      foodExtraTypeId: r.food_extra_type_id != null ? idMap.get(T.food_extra_type, r.food_extra_type_id) : undefined,
      amount: r.amount ?? null,
      measureUnitTypeId: r.measure_unit_types_id != null ? idMap.get(T.measure_unit, r.measure_unit_types_id) : undefined,
      frequencyId: r.dosage_frequency_id != null ? idMap.get(T.dosage_frequency, r.dosage_frequency_id) : undefined,
      notes: r.comments ?? null,
    });
  }
  for (const r of getRows(T.case_exams)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;
    c.planned.examinations.push({
      examinationTypeId: r.examination_type_id != null ? idMap.get(T.examination_type, r.examination_type_id) : undefined,
      scheduledFor: toDate(r.date) ?? undefined,
      status: r.status ?? "PLANNED",
      notes: r.comments ?? null,
    });
  }

  // Daily grid
  const dailyById = new Map();
  for (const r of getRows(T.case_daily_details)) {
    const c = caseDocByLegacyId.get(String(r.case_id));
    if (!c) continue;
    const row = {
      _id: idMap.get(T.case_daily_details, r.id),
      index: toNumber(r.index) ?? undefined,
      date: toDate(r.date) ?? null,
      time: r.time ?? null,
      vitals: {
        temp: toNumber(r.temp) ?? undefined,
        tempIsRequired: toBool(r.temp_is_required) ?? undefined,
        tempIsEditable: toBool(r.temp_is_editable) ?? undefined,
        pulse: toNumber(r.pulse) ?? undefined,
        pulseIsRequired: toBool(r.pulse_is_required) ?? undefined,
        pulseIsEditable: toBool(r.pulse_is_editable) ?? undefined,
        respiration: toNumber(r.respiration) ?? undefined,
        respirationIsRequired: toBool(r.respiration_is_required) ?? undefined,
        respirationIsEditable: toBool(r.respiration_is_editable) ?? undefined,
      },
      urine: {
        urineTypeId: r.urine_type_id != null ? idMap.get(T.urine_type, r.urine_type_id) : undefined,
        comments: r.urine_comments ?? null,
        isRequired: toBool(r.urine_is_required) ?? undefined,
        isEditable: toBool(r.urine_is_editable) ?? undefined,
      },
      feces: {
        fecesTypeId: r.feces_type_id != null ? idMap.get(T.feces_type, r.feces_type_id) : undefined,
        comments: r.feces_comments ?? null,
        isRequired: toBool(r.feces_is_required) ?? undefined,
        isEditable: toBool(r.feces_is_editable) ?? undefined,
      },
      boxClean: {
        value: toBool(r.is_box_clean) ?? undefined,
        isRequired: toBool(r.is_box_clean_is_required) ?? undefined,
        isEditable: toBool(r.is_box_clean_is_editable) ?? undefined,
      },
      releaseRow: {
        value: toBool(r.is_release) ?? undefined,
        isRequired: toBool(r.is_release_is_required) ?? undefined,
        isEditable: toBool(r.is_release_is_editable) ?? undefined,
      },
      // optional fields seen in your SQL view
      walkTrip: r.is_walk_trip != null ? { value: toBool(r.is_walk_trip), isRequired: toBool(r.is_walk_trip_is_required) ?? undefined, isEditable: toBool(r.is_walk_trip_is_editable) ?? undefined } : undefined,
      puke: r.is_puke != null ? { value: toBool(r.is_puke), comments: r.puke_comments ?? null, isRequired: toBool(r.puke_is_required) ?? undefined, isEditable: toBool(r.puke_is_editable) ?? undefined } : undefined,
      weigh: r.weigh != null ? { value: toNumber(r.weigh) ?? r.weigh, isRequired: toBool(r.weigh_is_required) ?? undefined, isEditable: toBool(r.weigh_is_editable) ?? undefined } : undefined,
      foodAndWater: r.food_and_water != null ? { value: r.food_and_water, isRequired: toBool(r.food_and_water_is_required) ?? undefined, isEditable: toBool(r.food_and_water_is_editable) ?? undefined } : undefined,
      comments: r.comments != null ? { value: r.comments, isRequired: toBool(r.comments_is_required) ?? undefined, isEditable: toBool(r.comments_is_editable) ?? undefined } : undefined,
      ownerUpdate: r.owner_update != null ? { value: r.owner_update, isRequired: toBool(r.owner_update_is_required) ?? undefined, isEditable: toBool(r.owner_update_is_editable) ?? undefined } : undefined,

      fluids: [],
      medicines: [],
      procedures: [],
      examinations: [],
      foodExtras: [],
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    };
    c.caseDetailsGrid.push(row);
    dailyById.set(String(r.id), row);
  }

  for (const r of getRows(T.cdd_meds)) {
    const row = dailyById.get(String(r.case_daily_details_id));
    if (!row) continue;
    row.medicines.push({
      medicineId: r.medicine_id != null ? idMap.get(T.medicine, r.medicine_id) : undefined,
      doseAmount: r.dose_amount ?? null,
      dosageText: r.dosage ?? null,
      measureUnitTypeId: r.measure_unit_types_id != null ? idMap.get(T.measure_unit, r.measure_unit_types_id) : undefined,
      dosageFrequencyId: r.dosage_frequency_id != null ? idMap.get(T.dosage_frequency, r.dosage_frequency_id) : undefined,
      routeOfAdministrationId: r.route_of_administration_id != null ? idMap.get(T.roa, r.route_of_administration_id) : undefined,
      isGiven: toBool(r.is_given) ?? undefined,
      isRequired: toBool(r.is_required) ?? undefined,
      isEditable: toBool(r.is_editable) ?? undefined,
      comment: r.comment ?? null,
    });
  }
  for (const r of getRows(T.cdd_procs)) {
    const row = dailyById.get(String(r.case_daily_details_id));
    if (!row) continue;
    row.procedures.push({
      procedureTypeId: r.procedure_type_id != null ? idMap.get(T.procedure_type, r.procedure_type_id) : undefined,
      isGiven: toBool(r.is_given) ?? undefined,
      isRequired: toBool(r.is_required) ?? undefined,
      isEditable: toBool(r.is_editable) ?? undefined,
      comment: r.comment ?? null,
    });
  }
  for (const r of getRows(T.cdd_food)) {
    const row = dailyById.get(String(r.case_daily_details_id));
    if (!row) continue;
    row.foodExtras.push({
      foodExtraTypeId: r.food_extra_type_id != null ? idMap.get(T.food_extra_type, r.food_extra_type_id) : undefined,
      measureUnitTypeId: r.measure_unit_types_id != null ? idMap.get(T.measure_unit, r.measure_unit_types_id) : undefined,
      doseAmount: r.dose_amount ?? r.amount ?? null,
      isGiven: toBool(r.is_given) ?? undefined,
      isRequired: toBool(r.is_required) ?? undefined,
      isEditable: toBool(r.is_editable) ?? undefined,
      comment: r.comment ?? null,
    });
  }
  for (const r of getRows(T.cdd_exams)) {
    const row = dailyById.get(String(r.case_daily_details_id));
    if (!row) continue;
    row.examinations.push({
      examinationTypeId: r.examination_type_id != null ? idMap.get(T.examination_type, r.examination_type_id) : undefined,
      isGiven: toBool(r.is_given) ?? undefined,
      isRequired: toBool(r.is_required) ?? undefined,
      isEditable: toBool(r.is_editable) ?? undefined,
      value: r.value ?? undefined,
      comment: r.comment ?? null,
    });
  }

  // Anesthesia forms
  for (const r of getRows(T.anesthesia)) {
    out.anesthesia_forms.push({
      _id: idMap.get(T.anesthesia, r.id),
      caseId: r.case_id != null ? idMap.get(T.case, r.case_id) : undefined,
      ownerName: r.owner_name ?? null,
      name: r.name ?? null,
      date: toDate(r.date) ?? r.date ?? null,
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
      createdByUserId: r.created_by_id != null ? idMap.get(T.user, r.created_by_id) : undefined,
      updatedByUserId: r.updated_by_id != null ? idMap.get(T.user, r.updated_by_id) : undefined,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    });
  }

  // Documents
  for (const r of getRows(T.patient_document)) {
    out.patient_documents.push({
      _id: idMap.get(T.patient_document, r.id),
      patientId: r.patient_id != null ? idMap.get(T.patient, r.patient_id) : undefined,
      caseId: r.case_id != null ? idMap.get(T.case, r.case_id) : undefined,
      patientDocumentTypeId: r.patient_document_type_id != null ? idMap.get(T.patient_document_type, r.patient_document_type_id) : undefined,
      fileName: r.file_name ?? r.name ?? null,
      storageKey: r.path ?? r.storage_key ?? r.file_path ?? null,
      uploadedByUserId: r.created_by_id != null ? idMap.get(T.user, r.created_by_id) : undefined,
      uploadedAt: toDate(r.uploaded_at) ?? toDate(r.created_at) ?? new Date(),
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    });
  }

  // Patient medicines
  for (const r of getRows(T.patient_medicine)) {
    out.patient_medicines.push({
      _id: idMap.get(T.patient_medicine, r.id),
      patientId: r.patient_id != null ? idMap.get(T.patient, r.patient_id) : undefined,
      caseId: r.case_id != null ? idMap.get(T.case, r.case_id) : undefined,
      medicineId: r.medicine_id != null ? idMap.get(T.medicine, r.medicine_id) : undefined,
      dosageFrequencyId: r.dosage_frequency_id != null ? idMap.get(T.dosage_frequency, r.dosage_frequency_id) : undefined,
      routeOfAdministrationId: r.route_of_administration_id != null ? idMap.get(T.roa, r.route_of_administration_id) : undefined,
      measureUnitTypeId: r.measure_unit_types_id != null ? idMap.get(T.measure_unit, r.measure_unit_types_id) : undefined,
      doseAmount: r.dose_amount ?? null,
      notes: r.comments ?? r.note ?? null,
      startDate: toDate(r.start_date) ?? undefined,
      endDate: toDate(r.end_date) ?? undefined,
      isActive: toBool(r.is_active) ?? undefined,
      createdAt: toDate(r.created_at) ?? undefined,
      updatedAt: toDate(r.updated_at) ?? undefined,
    });
  }

  // Audit logs
  for (const r of getRows(T.audit)) {
    out.audit_logs.push({
      _id: idMap.get(T.audit, r.id),
      subject: r.subject ?? null,
      description: r.description ?? null,
      entityType: r.entity_type ?? r.table_name ?? "unknown",
      entityId: r.entity_id ?? r.row_id ?? null,
      performedByUserId: r.created_by_id != null ? idMap.get(T.user, r.created_by_id) : undefined,
      createdAt: toDate(r.created_at) ?? new Date(),
    });
  }

  return out;
}


function toObjectIdDeep(value, ObjectId) {
  if (value == null) return value;
  if (typeof value === "string" && /^[a-f0-9]{24}$/.test(value)) return new ObjectId(value);
  if (Array.isArray(value)) return value.map((v) => toObjectIdDeep(v, ObjectId));
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = toObjectIdDeep(v, ObjectId);
    return out;
  }
  return value;
}

async function insertAll(client, dbName, docsByCollection) {
  const db = client.db(dbName);

  const order = [
    "animal_types","animal_colors","gender_types","insurance_types","food_types","food_extra_types","examination_types",
    "feces_types","urine_types","dosage_frequencies","measure_unit_types","procedure_types","medicine_categories","medicines",
    "routes_of_administration","race_types","patient_document_types","animal_vitals",
    "users","patients","master_cases","cases","anesthesia_forms","patient_documents","patient_medicines","audit_logs"
  ];

  for (const name of order) {
    const docs = docsByCollection[name];
    if (!docs) continue;
    const coll = db.collection(name);
    if (docs.length === 0) {
      console.log(`skipping ${name} (0 docs)`);
      continue;
    }
    await coll.deleteMany({});
    const batchSize = 1000;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize).map((d) => toObjectIdDeep(d, ObjectId));
      await coll.insertMany(batch, { ordered: false });
    }
    console.log(`inserted ${docs.length} docs into ${name}`);
  }
}

async function main() {
  const args = parseArgs();
  console.log("Parsing pg_dump COPY blocks...");
  const tables = await parsePgDumpCopyBlocks(args.input);

  console.log("Building Petec V2 documents...");
  const docsByCollection = buildV2Docs(tables);

  const counts = Object.fromEntries(Object.entries(docsByCollection).map(([k,v]) => [k, (v?.length ?? 0)]));
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  console.log(`Built ${total} documents`);
  console.log(counts);

  if (args.dry) {
    console.log("--dry specified. Not connecting to Mongo / not inserting.");
    return;
  }

  console.log("Connecting to MongoDB...");
  const { MongoClient, ObjectId } = require("mongodb");
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
