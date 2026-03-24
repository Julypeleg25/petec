import { EntityTarget } from "typeorm";
import { AppDataSource } from "../../config/typeORM";
import bcrypt from "bcrypt";

export const checkDoesIdExist = async (
  id: number,
  entity: EntityTarget<any>
): Promise<boolean> => {
  const repository = AppDataSource.getRepository(entity);
  const exists = await repository.findOneBy({ id });

  return !!exists;
};

export const createHashedPassword = async (
  password: string
): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePasswords = (
  password: string,
  hashedPassword: string
): Promise<boolean> => bcrypt.compare(password, hashedPassword);
