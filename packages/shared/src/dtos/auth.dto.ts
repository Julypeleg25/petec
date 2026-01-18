import { z } from "zod";
import { UserDtoSchema } from "./user.dto";


export const AuthResponseSchema = z.object({
  user: UserDtoSchema,
  accessToken: z.string(),
});

export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;
