import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { roles, UserStatus, type Role } from "@petec/shared";
import { ENV } from "../src/config/config.js";
import { UserModel } from "../src/models/user/User.js";

const missingActiveStaff: Array<{
  sourceUserId: string;
  firstName: string;
  lastName: string;
  role: Role;
}> = [
  {
    sourceUserId: "3fab2306-7fcb-4b7b-bd80-9a9ea288f49d",
    firstName: "אלינה",
    lastName: "פילצ'קוב",
    role: roles.ASSISTANT,
  },
  {
    sourceUserId: "532fbaaa-8b51-409e-b218-4e07c0cda305",
    firstName: "דניאל",
    lastName: "שטרית בשן",
    role: roles.DOCTOR,
  },
  {
    sourceUserId: "50f34fe5-cf15-41db-b053-35b02346c75a",
    firstName: "הדס",
    lastName: "פוריה דאלי",
    role: roles.DOCTOR,
  },
];

const normalizeName = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0591-\u05c7]/g, "")
    .replace(/["'׳״`.,/\\()[\]{}_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("he-IL");

await mongoose.connect(ENV.mongoDBUri);
try {
  const users = await UserModel.find({ isDeleted: { $ne: true } }).lean();
  const added: string[] = [];
  const existing: string[] = [];

  for (const staff of missingActiveStaff) {
    const fullName = `${staff.firstName} ${staff.lastName}`;
    const duplicate = users.find(
      (user) =>
        normalizeName(`${user.firstName} ${user.lastName}`) ===
        normalizeName(fullName),
    );
    if (duplicate) {
      existing.push(fullName);
      continue;
    }

    const passwordHash = await bcrypt.hash(randomBytes(48).toString("base64url"), 12);
    const suffix = staff.sourceUserId.replace(/-/g, "");
    const created = await UserModel.create({
      username: `clinica-${suffix}`,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: `clinica-${suffix}@local.invalid`,
      passwordHash,
      role: staff.role,
      privileges: [],
      status: UserStatus.ACTIVE,
      isDeleted: false,
    });
    users.push(created.toObject());
    added.push(`${fullName} (${staff.role})`);
  }

  console.log(JSON.stringify({ added, existing }, null, 2));
} finally {
  await mongoose.disconnect();
}
