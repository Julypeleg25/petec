import { z } from "zod";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z.string().refine(
    (val) => OBJECT_ID_REGEX.test(val),
    { message: "Invalid ObjectId format" },
);
export type ObjectIdString = z.infer<typeof objectIdSchema>;

export const dateCoerceSchema = z.coerce.date();

export const optionalDateCoerceSchema = z.coerce.date().optional();

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

export const sortSchema = z.object({
    sortBy: z.string().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type SortInput = z.infer<typeof sortSchema>;

export const isValidObjectId = (value: string): boolean => OBJECT_ID_REGEX.test(value);

export const safeParse = <T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
};
