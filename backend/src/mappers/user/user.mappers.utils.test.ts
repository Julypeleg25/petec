import { UserStatus } from "@petec/shared";
import { Types } from "mongoose";
import {
  toFullName,
  toUserIdString,
  toUserIsoString,
  toUserStatus,
} from "./user.mappers.utils.js";

describe("user.mappers.utils", () => {
  it("converts user ids to strings", () => {
    const objectId = new Types.ObjectId();

    expect(toUserIdString(objectId.toString() as never)).toBe(objectId.toString());
    expect(toUserIdString({ toString: () => "user-1" } as never)).toBe("user-1");
  });

  it("formats user timestamps safely", () => {
    const date = new Date("2026-04-19T07:30:00.000Z");

    expect(toUserIsoString(date)).toBe("2026-04-19T07:30:00.000Z");
    expect(toUserIsoString("2026-04-19T07:30:00.000Z")).toBe(
      "2026-04-19T07:30:00.000Z",
    );
    expect(toUserIsoString("bad-date")).toBe("");
    expect(toUserIsoString(undefined)).toBe("");
  });

  it("normalizes user status and full names", () => {
    expect(toUserStatus(UserStatus.INACTIVE)).toBe(UserStatus.INACTIVE);
    expect(toUserStatus("something-else")).toBe(UserStatus.ACTIVE);
    expect(toFullName("  Dana ", "  Levi ")).toBe("Dana Levi");
    expect(toFullName("Dana", undefined)).toBe("Dana");
  });
});
