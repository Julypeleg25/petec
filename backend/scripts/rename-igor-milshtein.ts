import mongoose from "mongoose";
import { ENV } from "../src/config/config.js";
import { UserModel } from "../src/models/user/User.js";

await mongoose.connect(ENV.mongoDBUri);
try {
  const user = await UserModel.findOneAndUpdate(
    {
      username: { $regex: /^igor milshtein$/i },
      isDeleted: { $ne: true },
    },
    {
      $set: {
        firstName: "Igor",
        lastName: "Milshtein",
      },
    },
    { returnDocument: "after" },
  ).select({ firstName: 1, lastName: 1, role: 1 });

  if (!user) throw new Error("Igor Milshtein user was not found");
  console.log(JSON.stringify(user.toObject(), null, 2));
} finally {
  await mongoose.disconnect();
}
