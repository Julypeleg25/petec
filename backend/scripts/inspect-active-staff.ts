import mongoose from "mongoose";
import { ENV } from "../src/config/config.js";
import { UserModel } from "../src/models/user/User.js";
import { roles, UserStatus } from "@petec/shared";

await mongoose.connect(ENV.mongoDBUri);
try {
  const users = await UserModel.find({
    role: { $in: [roles.DOCTOR, roles.ASSISTANT] },
    status: UserStatus.ACTIVE,
    isDeleted: { $ne: true },
  })
    .select({ firstName: 1, lastName: 1, role: 1, username: 1, email: 1 })
    .sort({ role: 1, firstName: 1, lastName: 1 })
    .lean();
  console.log(JSON.stringify(users, null, 2));
} finally {
  await mongoose.disconnect();
}
