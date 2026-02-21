import { Request, Response, NextFunction } from "express";
import { userService } from "@services/user.service";
import { sendSuccess } from "@utils/apiResponse";
import { StaffMemberListResponseDTOSchema } from "@petec/shared";

export class UserController {
    async getDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await userService.getDoctors();
            sendSuccess(res, result, StaffMemberListResponseDTOSchema);
        } catch (err) {
            next(err);
        }
    };

    async getNurses(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await userService.getNurses();
            sendSuccess(res, result, StaffMemberListResponseDTOSchema);
        } catch (err) {
            next(err);
        }
    };
}

export const userController = new UserController();
