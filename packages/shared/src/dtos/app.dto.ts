import { z } from "zod";

export const HealthResponseDTOSchema = z.object({
  status: z.literal("healthy"),
}).strict();
export type HealthResponseDTO = z.infer<typeof HealthResponseDTOSchema>;
