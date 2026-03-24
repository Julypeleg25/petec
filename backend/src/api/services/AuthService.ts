import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AppDataSource } from "../../config/typeORM";
import { Repository } from "typeorm";
import { UserRole } from "../models/UserRole";
import { Response } from "express";
import logger from "../../api/utils/Logger";
import { comparePasswords, createHashedPassword } from "../utils";
import { EmailData, sendEmail } from "../utils/EmailService";

class AuthService {
  private userRepository: Repository<User>;
  private userRoleRepository: Repository<UserRole>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.userRoleRepository = AppDataSource.getRepository(UserRole);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email, isDeleted: false },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username: username, isDeleted: false },
    });
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: id, isDeleted: false },
    });
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user != null;
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user != null;
  }

  async findByEmailAndUsername(
    email: string,
    username: string
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, username, isDeleted: false },
    });
  }

  async register(
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string,
    roleId: number
  ): Promise<User> {
    // Validation
    if (await this.isEmailTaken(email)) throw new Error("אימייל כבר קיים");
    if (await this.isUsernameTaken(username))
      throw new Error("שם משתמש כבר קיים");

    const userRole = await this.userRoleRepository.findOneBy({
      id: roleId,
    });
    if (!userRole) throw new Error("תפקיד עם מספר זהות זה לא קיים");

    // Register the user
    const encryptedPassword = await createHashedPassword(password);

    const newUser = new User();
    newUser.username = username;
    newUser.password = encryptedPassword;
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.email = email;
    newUser.createdAt = new Date();
    newUser.userRole = {
      id: roleId,
    } as UserRole;
    await this.userRepository.save(newUser);

    logger.info("User registered successfully, ID: " + newUser.id);
    return newUser;
  }

  async login(username: string, password: string): Promise<any> {
    // Check credentials
    const user = await this.findByUsername(username);
    if (!user) throw new Error("שם משתמש או סיסמה שגויים");

    const match = await comparePasswords(password, user.password);
    if (!match) throw new Error("שם משתמש או סיסמה שגויים");

    // Create JWT
    const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRATION } = process.env;
    const tokenValues = {
      userId: user.id,
      userRole: user.userRole.name,
      userFullName: user.firstName + " " + user.lastName,
    };
    const accessToken = jwt.sign(tokenValues, JWT_SECRET!!, {
      expiresIn: JWT_EXPIRATION,
    });
    const refreshToken = jwt.sign(tokenValues, JWT_REFRESH_SECRET!!);
    user.refreshToken = refreshToken;

    await this.userRepository.save(user);

    logger.info("User logged in successfully, ID: " + user.id);
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async logout(refreshToken: string, res: Response): Promise<void> {
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!!,
      async (err, user) => {
        if (err || !user) {
          res.sendStatus(401);
          return;
        }

        try {
          const userDb = await this.findUserById((user as any).userId);
          if (userDb == null) {
            res.sendStatus(400);
            return;
          }

          const userToken = userDb.refreshToken;
          userDb.refreshToken = null;
          await this.userRepository.save(userDb);

          logger.info("User logged out successfully, ID: " + userDb.id);
          if (userToken !== refreshToken) res.sendStatus(401);
          else res.sendStatus(200);
        } catch (err: any) {
          res.status(500).json(err.message);
        }
      }
    );
  }

  async refreshToken(refreshToken: string, res: Response): Promise<void> {
    const { JWT_EXPIRATION, JWT_REFRESH_SECRET, JWT_SECRET } = process.env;

    jwt.verify(refreshToken, JWT_REFRESH_SECRET!!, async (err, user) => {
      if (err) return res.status(401).send();

      try {
        const userDb = await this.findUserById((user as any).userId);
        if (userDb == null) {
          res.sendStatus(400);
          return;
        }

        if (userDb.refreshToken !== refreshToken) {
          logger.error("Refresh token not found");
          userDb.refreshToken = null;
          await this.userRepository.save(userDb);
          res.sendStatus(401);
          return;
        }

        const tokenValues = {
          userId: userDb.id,
          userRole: userDb.userRole.name,
          userFullName: userDb.firstName + " " + userDb.lastName,
        };
        const accessToken = jwt.sign(tokenValues, JWT_SECRET!!, {
          expiresIn: JWT_EXPIRATION,
        });
        const newRefreshToken = jwt.sign(tokenValues, JWT_REFRESH_SECRET!!);
        userDb.refreshToken = newRefreshToken;
        await this.userRepository.save(userDb);

        res.status(200).json({
          accessToken: accessToken,
          refreshToken: newRefreshToken,
        });
      } catch (err: any) {
        res.status(500).json(err.message);
      }
    });
  }

  async getUserRoles(): Promise<UserRole[]> {
    return await this.userRoleRepository.find();
  }

  async sendResetPasswordEmail(email: string, userName: string): Promise<void> {
    const mailOptions: EmailData = {
      to: email,
      subject: "איפוס סיסמה",
      htmlPart: `כדי לאפס את סיסמתך אנא לחץ על הקישור <a href=${this.generateResetPasswordLink(
        email,
        userName
      )}>איפוס סיסמא</a>`,
    };

    try {
      const result = await sendEmail(mailOptions);
      logger.info(`Reset password email sent: ${result?.response?.statusText}`);
    } catch (err: any) {
      logger.error(`Failed to send reset password email: ${err.message}`);
      throw new Error("אימייל לא נשלח, נסה שוב מאוחר יותר");
    }
  }

  private generateResetPasswordLink(email: string, userName: string): string {
    const { JWT_SECRET, RESET_PASSWORD_EXPIRATION, FLY_APP_URL, NODE_ENV } =
      process.env;
    const token = jwt.sign({ email, userName }, JWT_SECRET!!, {
      expiresIn: RESET_PASSWORD_EXPIRATION,
    });

    return `${
      NODE_ENV === "production"
        ? `https://${FLY_APP_URL}`
        : `http://localhost:3001`
    }/#/resetPassword/${token}`;
  }

  async resetPassword(password: string, userName: string): Promise<void> {
    await this.userRepository.update(
      { username: userName },
      { password: await createHashedPassword(password) }
    );
  }
}

export default new AuthService();
