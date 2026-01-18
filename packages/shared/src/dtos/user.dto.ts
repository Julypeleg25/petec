import z from "zod";
import { RoleDtoSchema } from "./role.dto";

export const UserDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: RoleDtoSchema
});

export type UserDto = z.infer<typeof UserDtoSchema>;
