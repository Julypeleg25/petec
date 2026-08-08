import mongoose from "mongoose";
import { ENV } from "../src/config/config.js";
import { AnimalColorModel } from "../src/models/lookups/Lookups.js";

await mongoose.connect(ENV.mongoDBUri);
try {
  const colors = await AnimalColorModel.find({ isDeleted: false })
    .select({ name: 1 })
    .sort({ name: 1 })
    .lean();
  console.log(JSON.stringify(colors.map(({ name }) => name), null, 2));
} finally {
  await mongoose.disconnect();
}
