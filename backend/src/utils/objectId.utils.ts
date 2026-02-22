import { Types } from "mongoose";

export const toObjectId = (str: string): Types.ObjectId =>
    new Types.ObjectId(str);

export const toOptionalObjectId = (str: string | undefined): Types.ObjectId | undefined =>
    str ? new Types.ObjectId(str) : undefined;
