import { z } from "zod";

export const CategoryIdParamsDTOSchema = z.object({
    categoryId: z.string().min(1).trim(),
}).strict();
export type CategoryIdParamsDTO = z.infer<typeof CategoryIdParamsDTOSchema>;
