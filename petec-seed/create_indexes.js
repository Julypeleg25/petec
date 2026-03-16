const { MongoClient } = require("mongodb");
require("dotenv").config();

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { mongo: process.env.MONGODB_URI, db: process.env.MONGODB_DB };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mongo") out.mongo = args[++i];
    else if (args[i] === "--db") out.db = args[++i];
  }
  if (!out.mongo || !out.db) throw new Error("Usage: --mongo <uri> --db <db>");
  return out;
}

async function ensureIndexes(db) {
  await createIndexesSafely(db.collection("patients"), [
    { key: { serialId: 1 }, name: "patients_serialId_uq", unique: true },
    { key: { "owner.phone": 1 }, name: "patients_owner_phone" },
    { key: { name: 1 }, name: "patients_name" },
  ]);

  await createIndexesSafely(db.collection("cases"), [
    { key: { serialId: 1 }, name: "cases_serialId_uq", unique: true },
    { key: { patientId: 1, isDeleted: 1 }, name: "cases_patient_isDeleted" },
    { key: { masterCaseId: 1 }, name: "cases_masterCaseId" },
    { key: { isArchived: 1, releaseDate: -1 }, name: "cases_archived_releaseDate" },
    { key: { createdAt: -1 }, name: "cases_createdAt" },
    { key: { "caseDetailsGrid.dateTime": -1 }, name: "cases_grid_dateTime" },
  ]);

  await createIndexesSafely(db.collection("master_cases"), [
    { key: { caseIds: 1 }, name: "master_cases_caseIds" },
    { key: { patientId: 1 }, name: "master_cases_patientId" },
  ]);

  await createIndexesSafely(db.collection("anesthesia_forms"), [
    { key: { caseId: 1 }, name: "anesthesia_caseId_uq", unique: true },
  ]);

  await createIndexesSafely(db.collection("patient_documents"), [
    { key: { patientId: 1 }, name: "docs_patientId" },
    { key: { caseId: 1 }, name: "docs_caseId" },
    { key: { patientDocumentTypeId: 1 }, name: "docs_type" },
  ]);

  await createIndexesSafely(db.collection("patient_medicines"), [
    { key: { patientId: 1, isDeleted: 1 }, name: "patient_meds_patient_deleted" },
    { key: { caseId: 1 }, name: "patient_meds_caseId" },
  ]);

  await createIndexesSafely(db.collection("audit_logs"), [
    { key: { entityType: 1, entityId: 1, createdAt: -1 }, name: "audit_entity_time" },
    { key: { createdAt: -1 }, name: "audit_time" },
  ]);

  const typeCollections = [
    "animal_types","race_types","animal_colors","animal_vitals","gender_types","insurance_types",
    "food_types","food_extra_types","examination_types","feces_types","urine_types",
    "dosage_frequencies","measure_unit_types","procedure_types","medicines","medicine_categories",
    "routes_of_administration","patient_document_types"
  ];
  for (const c of typeCollections) {
    await createIndexesSafely(db.collection(c), [
      { key: { name: 1 }, name: `${c}_name_uq`, unique: true },
      { key: { serialId: 1 }, name: `${c}_serialId_uq`, unique: true },
      { key: { isDeleted: 1 }, name: `${c}_isDeleted` },
    ]);
  }
}

async function createIndexesSafely(collection, indexes) {
  for (const index of indexes) {
    const { key, ...options } = index;
    try {
      await collection.createIndex(key, options);
    } catch (error) {
      const message = error?.errmsg || error?.message || "";
      if (error?.code === 85 && message.includes("already exists with a different name")) {
        continue;
      }
      throw error;
    }
  }
}

async function main() {
  const { mongo, db: dbName } = parseArgs();
  const client = new MongoClient(mongo, { maxPoolSize: 10 });
  await client.connect();
  try {
    const db = client.db(dbName);
    await ensureIndexes(db);
    console.log("Indexes created.");
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
