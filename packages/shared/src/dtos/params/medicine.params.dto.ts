import { z } from "zod";
import { MEDICINE_CATEGORY_TYPE_VALUES } from "../../constants/systemTypes.constants.js";

export const CategoryTypeParamsDTOSchema = z.object({
    categoryType: z.enum(MEDICINE_CATEGORY_TYPE_VALUES),
}).strict();
export type CategoryTypeParamsDTO = z.infer<typeof CategoryTypeParamsDTOSchema>;
