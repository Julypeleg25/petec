const { MongoClient } = require("mongodb");
require("dotenv").config();

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { mongo: process.env.MONGODB_URI, db: process.env.MONGODB_DB, hours: 12 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mongo") out.mongo = args[++i];
    else if (args[i] === "--db") out.db = args[++i];
    else if (args[i] === "--hours") out.hours = Number(args[++i]);
  }
  if (!out.mongo || !out.db) throw new Error("Usage: --mongo <uri> --db <db> [--hours N]");
  if (!Number.isFinite(out.hours) || out.hours <= 0) throw new Error("--hours must be a positive number");
  return out;
}

function buildPipeline(hours) {
  const now = new Date();
  const since = new Date(now.getTime() - hours * 60 * 60 * 1000);

  return [
    { $match: { isDeleted: { $ne: true }, isArchived: { $ne: true } } },
    { $lookup: { from: "patients", localField: "patientId", foreignField: "_id", as: "patient" } },
    { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$caseDetailsGrid", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        rowDateTime: {
          $dateFromString: {
            dateString: {
              $concat: [
                { $dateToString: { format: "%Y-%m-%d", date: "$caseDetailsGrid.date" } },
                "T",
                { $ifNull: ["$caseDetailsGrid.time", "00:00"] },
                ":00",
              ],
            },
          },
        },
      },
    },
    { $match: { rowDateTime: { $gte: since, $lte: now } } },
    {
      $addFields: {
        alert_medicine_missing: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ["$caseDetailsGrid.medicines", []] },
                  as: "m",
                  cond: {
                    $and: [
                      { $eq: ["$$m.isEditable", true] },
                      { $eq: ["$$m.isRequired", true] },
                      { $or: [{ $eq: ["$$m.isGiven", null] }, { $eq: ["$$m.isGiven", false] }] },
                    ],
                  },
                },
              },
            },
            0,
          ],
        },
        alert_exam_missing: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ["$caseDetailsGrid.examinations", []] },
                  as: "e",
                  cond: {
                    $and: [
                      { $eq: ["$$e.isEditable", true] },
                      { $eq: ["$$e.isRequired", true] },
                      { $or: [{ $eq: ["$$e.value", null] }, { $eq: ["$$e.value", ""] }] },
                    ],
                  },
                },
              },
            },
            0,
          ],
        },
        alert_food_extra_missing: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ["$caseDetailsGrid.foodExtras", []] },
                  as: "f",
                  cond: {
                    $and: [
                      { $eq: ["$$f.isEditable", true] },
                      { $eq: ["$$f.isRequired", true] },
                      { $or: [{ $eq: ["$$f.isGiven", null] }, { $eq: ["$$f.isGiven", false] }] },
                    ],
                  },
                },
              },
            },
            0,
          ],
        },
        alert_required_fields_missing: {
          $or: [
            { $and: [{ $eq: ["$caseDetailsGrid.urine.isEditable", true] }, { $eq: ["$caseDetailsGrid.urine.isRequired", true] }, { $eq: ["$caseDetailsGrid.urine.urineTypeId", null] }] },
            { $and: [{ $eq: ["$caseDetailsGrid.feces.isEditable", true] }, { $eq: ["$caseDetailsGrid.feces.isRequired", true] }, { $eq: ["$caseDetailsGrid.feces.fecesTypeId", null] }] },
            { $and: [{ $eq: ["$caseDetailsGrid.boxClean.isEditable", true] }, { $eq: ["$caseDetailsGrid.boxClean.isRequired", true] }, { $eq: ["$caseDetailsGrid.boxClean.value", null] }] },
            { $and: [{ $eq: ["$caseDetailsGrid.releaseRow.isEditable", true] }, { $eq: ["$caseDetailsGrid.releaseRow.isRequired", true] }, { $eq: ["$caseDetailsGrid.releaseRow.value", null] }] },
          ],
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        num_of_alerts: {
          $sum: {
            $cond: [
              { $or: ["$alert_medicine_missing", "$alert_exam_missing", "$alert_food_extra_missing", "$alert_required_fields_missing"] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $project: { _id: 0, case_id: "$_id", num_of_alerts: 1 } },
  ];
}

async function main() {
  const { mongo, db: dbName, hours } = parseArgs();
  const client = new MongoClient(mongo, { maxPoolSize: 10 });
  await client.connect();
  try {
    const db = client.db(dbName);
    const results = await db.collection("cases").aggregate(buildPipeline(hours), { allowDiskUse: true }).toArray();
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
