import { readFile } from "node:fs/promises";
import mongoose, { Types } from "mongoose";
import { ENV } from "../src/config/config.js";
import { AnimalTypeModel, RaceTypeModel } from "../src/models/lookups/Lookups.js";

type SourceBreed = {
  BreedName?: unknown;
  Type?: unknown;
  ID?: unknown;
  TypeName?: unknown;
};

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Provide the source JSON file path");

const parsed = JSON.parse(await readFile(sourcePath, "utf8")) as { d?: unknown };
if (!Array.isArray(parsed.d)) throw new Error("Source JSON must contain a d array");

const normalize = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0591-\u05c7]/g, "")
    .replace(/["'׳״`.,/\\()[\]{}_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("he-IL");

const sourceRows = (parsed.d as SourceBreed[]).map((row) => ({
  breedName: String(row.BreedName ?? "").replace(/\s+/g, " ").trim(),
  type: String(row.Type ?? "").trim(),
  id: String(row.ID ?? "").trim(),
  typeName: String(row.TypeName ?? "").replace(/\s+/g, " ").trim(),
}));

if (
  sourceRows.some(
    (row) => !row.breedName || !row.type || !row.id || !row.typeName,
  )
) {
  throw new Error("Every source row must contain BreedName, Type, ID, and TypeName");
}

const sourceTypeNames = new Map<string, string>();
for (const row of sourceRows) {
  const existingName = sourceTypeNames.get(row.type);
  if (existingName && normalize(existingName) !== normalize(row.typeName)) {
    throw new Error(`Source type ${row.type} has conflicting names`);
  }
  sourceTypeNames.set(row.type, row.typeName);
}

await mongoose.connect(ENV.mongoDBUri);
try {
  const existingTypes = await AnimalTypeModel.find({});
  const typeIds = new Map<string, Types.ObjectId>();
  let animalTypesAdded = 0;
  let animalTypesRestored = 0;

  for (const [sourceType, typeName] of sourceTypeNames) {
    let type = existingTypes.find(
      (candidate) => normalize(candidate.name) === normalize(typeName),
    );
    if (!type) {
      type = await AnimalTypeModel.create({
        serialId: `clinica-type-${sourceType}`,
        name: typeName,
        isDeleted: false,
      });
      existingTypes.push(type);
      animalTypesAdded += 1;
    } else if (type.isDeleted) {
      type.isDeleted = false;
      await type.save();
      animalTypesRestored += 1;
    }
    typeIds.set(sourceType, type._id);
  }

  const existingBreeds = await RaceTypeModel.find({});
  const breedBySourceId = new Map(
    existingBreeds
      .filter((breed) => breed.serialId?.startsWith("clinica-breed-"))
      .map((breed) => [breed.serialId, breed]),
  );
  const breedByTypeAndName = new Map(
    existingBreeds.map((breed) => [
      `${breed.animalTypeId.toString()}:${normalize(breed.name)}`,
      breed,
    ]),
  );
  let breedsAdded = 0;
  let breedsUpdated = 0;
  let breedsRestored = 0;
  let breedsAlreadyPresent = 0;

  for (const row of sourceRows) {
    const animalTypeId = typeIds.get(row.type);
    if (!animalTypeId) throw new Error(`No mapped animal type for ${row.type}`);
    const serialId = `clinica-breed-${row.id}`;
    const nameKey = `${animalTypeId.toString()}:${normalize(row.breedName)}`;
    const bySourceId = breedBySourceId.get(serialId);
    const byName = breedByTypeAndName.get(nameKey);
    const breed = bySourceId ?? byName;

    if (!breed) {
      const created = await RaceTypeModel.create({
        serialId,
        name: row.breedName,
        animalTypeId,
        isDeleted: false,
      });
      breedBySourceId.set(serialId, created);
      breedByTypeAndName.set(nameKey, created);
      breedsAdded += 1;
      continue;
    }

    if (breed.isDeleted) {
      breed.isDeleted = false;
      breedsRestored += 1;
    }
    if (
      bySourceId &&
      (breed.name !== row.breedName ||
        breed.animalTypeId.toString() !== animalTypeId.toString())
    ) {
      breed.name = row.breedName;
      breed.animalTypeId = animalTypeId;
      breedsUpdated += 1;
    }
    if (breed.isModified()) await breed.save();
    breedsAlreadyPresent += 1;
  }

  console.log(JSON.stringify({
    sourceRows: sourceRows.length,
    sourceAnimalTypes: sourceTypeNames.size,
    animalTypesAdded,
    animalTypesRestored,
    breedsAdded,
    breedsUpdated,
    breedsRestored,
    breedsAlreadyPresent,
  }, null, 2));
} finally {
  await mongoose.disconnect();
}
