import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver, FieldValues } from "react-hook-form";

export const getSharedResolver = <TSchema extends z.ZodTypeAny>(
  schema: TSchema
): Resolver<z.infer<TSchema> & FieldValues> => zodResolver(schema);