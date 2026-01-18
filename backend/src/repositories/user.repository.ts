import { UserModel, IUser } from "../models/User";

export const UserRepo = {
  async create(user: Partial<IUser>) {
    return new UserModel(user).save();
  },

  async findByUsername(username: string) {
    return UserModel.findOne({ username }).select("+password");
  },

  async findByEmail(email: string) {
    return UserModel.findOne({ email });
  },

  async findById(id: string) {
    return UserModel.findById(id);
  },

  async save(user: IUser) {
    return user.save();
  },
};
