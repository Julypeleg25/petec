import { z } from "zod";

export const safeParse = <TSchema extends z.ZodType>(
  schema: TSchema,
  data: z.input<TSchema>,
): { success: true; data: z.output<TSchema> } | { success: false; error: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
};
