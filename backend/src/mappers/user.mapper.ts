import { IUser } from "@models/User";
import { UserDto } from "@shared/dtos/user.dto";

export const toUserDto = (user: IUser): UserDto => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: {
    id: (user.role as any)._id.toString(),
    name: (user.role as any).name,
  },
});
