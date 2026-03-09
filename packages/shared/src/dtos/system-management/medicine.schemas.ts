import { z } from "zod";
import { objectIdSchema } from "../../utils";

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const AdminMedicineRowDTOSchema = z
  .object({
    id: objectIdSchema,
    serial_id: z.string().nullable(),
    name: z.string().nullable(),

    category_id: objectIdSchema.nullable(),
    medicine_category: z.string().nullable(),

    measure_unit_id: objectIdSchema.nullable(),
    measure_unit: z.string().nullable(),

    dosage_frequency_id: objectIdSchema.nullable(),
    dosage_frequency: z.string().nullable(),

    route_of_administration_id: objectIdSchema.nullable(),
    route_of_administration: z.string().nullable(),

    range_min: z.number().nullable(),
    range_max: z.number().nullable(),
    total_dose: z.number().nullable(),
    comments: z.string().nullable(),

    is_deleted: z.boolean(),

    created_at: isoDateTimeSchema,
    updated_at: isoDateTimeSchema.nullable(),
  })
  .strict();

export const AdminMedicineRowListDTOSchema = z.array(AdminMedicineRowDTOSchema);

export type AdminMedicineRowDTO = z.infer<typeof AdminMedicineRowDTOSchema>;
export type AdminMedicineRowListDTO = z.infer<
  typeof AdminMedicineRowListDTOSchema
>;
