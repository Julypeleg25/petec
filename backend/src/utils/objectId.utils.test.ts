import { Types } from "mongoose";
import { toObjectId, toOptionalObjectId } from "./objectId.utils.js";

describe("objectId.utils", () => {
  it("creates an ObjectId from a valid string", () => {
    const id = new Types.ObjectId().toHexString();

    expect(toObjectId(id).toHexString()).toBe(id);
  });

  it("throws when the input is not a valid ObjectId", () => {
    expect(() => toObjectId("not-an-object-id")).toThrow();
  });

  it("returns undefined for missing optional ObjectIds", () => {
    expect(toOptionalObjectId()).toBeUndefined();
  });

  it("creates an optional ObjectId when a value is provided", () => {
    const id = new Types.ObjectId().toHexString();

    expect(toOptionalObjectId(id)?.toHexString()).toBe(id);
  });
});
