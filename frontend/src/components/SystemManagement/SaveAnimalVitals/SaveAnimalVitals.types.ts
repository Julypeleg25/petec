import * as z from "zod";

export const vitalsSchema = z
    .object({
        rangeMax: z.number({ error: "חייב להיות מספר" }).nullable(),
        rangeMin: z.number({ error: "חייב להיות מספר" }).nullable(),
        animalId: z.string().min(1, "שדה חובה"),
        vitalsType: z.string().min(1, "שדה חובה"),
    })
    .refine(
        (data) => {
            if (data.rangeMax != null && data.rangeMin != null) {
                return data.rangeMax >= data.rangeMin;
            }
            return true;
        },
        {
            message: "מקסימום חייב להיות גדול או שווה למינימום",
            path: ["rangeMax"],
        }
    );

export type FormValues = z.infer<typeof vitalsSchema>;
