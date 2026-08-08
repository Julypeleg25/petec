import mongoose from "mongoose";
import { ENV } from "../src/config/config.js";
import { AnimalTypeModel, RaceTypeModel } from "../src/models/lookups/Lookups.js";

await mongoose.connect(ENV.mongoDBUri);
try {
  const [animalTypes, breedCount] = await Promise.all([
    AnimalTypeModel.find({ isDeleted: { $ne: true } })
      .select({ name: 1, serialId: 1 })
      .sort({ name: 1 })
      .lean(),
    RaceTypeModel.countDocuments({ isDeleted: { $ne: true } }),
  ]);
  console.log(JSON.stringify({ animalTypes, breedCount }, null, 2));
} finally {
  await mongoose.disconnect();
}
