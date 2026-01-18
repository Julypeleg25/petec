import { z } from "zod";

export const RoleDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type RoleDto = z.infer<typeof RoleDtoSchema>;
