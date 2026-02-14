const { MongoClient, ObjectId } = require("mongodb");
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

async function upsertByName(coll, doc) {
  if (!doc?.name) throw new Error("Missing name");
  const now = new Date();
  await coll.updateOne(
    { name: doc.name },
    { $setOnInsert: { ...doc, createdAt: doc.createdAt ?? now, updatedAt: doc.updatedAt ?? now } },
    { upsert: true }
  );
}

async function main() {
  const { mongo, db: dbName } = parseArgs();
  const client = new MongoClient(mongo, { maxPoolSize: 10 });
  await client.connect();
  const db = client.db(dbName);

  const medicineCategories = db.collection("medicine_categories");
  await upsertByName(medicineCategories, { name: "תרופות", isActive: true });
  await upsertByName(medicineCategories, { name: "נוזלים", isActive: true });
  await upsertByName(medicineCategories, { name: "תוספות לנוזלים", isActive: true });

  const routes = db.collection("routes_of_administration");
  await upsertByName(routes, { name: "SIV", description: "מתן וורידי איטי", isActive: true });
  await upsertByName(routes, { name: "IV", description: "מתן וורידי", isActive: true });
  await upsertByName(routes, { name: "IM", description: "מתן שרירי", isActive: true });

  const docTypes = db.collection("patient_document_types");
  const now = new Date();
  await docTypes.updateOne(
    { legacyId: 1 },
    { $setOnInsert: { legacyId: 1, name: "blood-test", isActive: true, createdAt: now, updatedAt: now } },
    { upsert: true }
  );
  await docTypes.updateOne(
    { legacyId: 2 },
    { $setOnInsert: { legacyId: 2, name: "xray", isActive: true, createdAt: now, updatedAt: now } },
    { upsert: true }
  );

  const users = db.collection("users");
  await users.updateOne(
    { email: "systemAdmin@local" },
    {
      $setOnInsert: {
        email: "systemAdmin@local",
        passwordHash: "$2b$10$AfNe.pzo52y925cr2ZT6VuGCK/FYTFyNKhwGv356q8mNUX83Pxxzy",
        role: "ADMIN",
        privileges: [],
        status: "ACTIVE",
        refreshTokens: [],
        createdAt: now,
        updatedAt: now,
        legacy: { username: "systemAdmin", firstName: "System", lastName: "Admin", legacyRoleId: 1 },
      },
    },
    { upsert: true }
  );

  console.log("Seeded baseline snippet data.");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
