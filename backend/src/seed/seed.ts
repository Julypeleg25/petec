import mongoose, { Types } from "mongoose";
import { ENV } from "../config/config.js";
import { logger } from "../utils/logger/logger.js";

import "../models/UserRole.js";
import "../models/User.js";

import { UserRoleModel } from "../models/UserRole.js";
import { UserModel } from "../models/User.js";

import { rolesSeed, usersSeed } from "./seed.data.js";

export const seed = async () => {
  await mongoose.connect(ENV.mongoDBUri);

  const roleIdMap = new Map<number, Types.ObjectId>();

  for (const role of rolesSeed) {
    const doc = await UserRoleModel.findOneAndUpdate(
      { name: role.name },
      { name: role.name },
      { upsert: true, new: true }
    );
    roleIdMap.set(role.oldId, doc._id);
  }

  for (const user of usersSeed) {
    const roleId = roleIdMap.get(user.roleOldId);
    if (!roleId) throw new Error("Missing role mapping");

    await UserModel.findOneAndUpdate(
      { username: user.username },
      { ...user, role: roleId },
      { upsert: true }
    );
  }

  logger.info("Seed completed");
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});