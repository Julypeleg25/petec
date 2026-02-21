import { z } from "zod";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z.string().refine(
  (val) => OBJECT_ID_REGEX.test(val),
  { message: "Invalid ObjectId format" },
);

export type ObjectIdString = z.infer<typeof objectIdSchema>;

export const isValidObjectId = (value: string): boolean => OBJECT_ID_REGEX.test(value);
