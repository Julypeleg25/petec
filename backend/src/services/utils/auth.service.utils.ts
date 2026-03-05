import bcrypt from "bcryptjs";
import type { IRefreshToken, UserDocument } from "@models/User";
import type { TokenPayload } from "@petec/shared";

export const isActiveUser = (user: Pick<UserDocument, "status" | "isDeleted">): boolean =>
  user.status === "ACTIVE" && !user.isDeleted;

export const buildAuthTokenPayload = (
  user: UserDocument,
): Omit<TokenPayload, "iat" | "exp"> => ({
  userId: user._id.toString(),
  role: user.role,
  privileges: user.privileges,
  username: user.username,
  fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
});

export const buildUserFullName = (
  user: Pick<UserDocument, "firstName" | "lastName">,
): string => `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

export const findMatchingRefreshToken = async (
  user: Pick<UserDocument, "refreshTokens">,
  rawToken: string,
): Promise<IRefreshToken | undefined> => {
  if (!user.refreshTokens || user.refreshTokens.length === 0) {
    return undefined;
  }

  for (const storedToken of user.refreshTokens) {
    if (storedToken.expiresAt < new Date()) {
      continue;
    }
    const isMatch = await bcrypt.compare(rawToken, storedToken.tokenHash);
    if (isMatch) {
      return storedToken;
    }
  }

  return undefined;
};
