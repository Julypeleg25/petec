import type { NextFunction, Request, Response } from "express";
import {
  CaseSuggestionsResponseSchema,
  type CaseSuggestionParams,
  type CaseSuggestionRequest,
  type Role,
} from "@petec/shared";
import { AuthError } from "../../constants/error.constants.js";
import { caseSuggestionService } from "../../services/caseSuggestion/index.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import {
  getValidatedBody,
  getValidatedParams,
} from "../../utils/request.utils.js";

export class CaseSuggestionController {
  async generate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { patientId, category } =
        getValidatedParams<CaseSuggestionParams>(req);
      const request = getValidatedBody<CaseSuggestionRequest>(req);
      const authenticatedUser = req.authenticatedUser;
      if (!authenticatedUser) {
        throw new AuthError("Authentication required");
      }

      const result = await caseSuggestionService.generate(
        patientId,
        category,
        request,
        {
          userId: authenticatedUser.userId,
          role: authenticatedUser.role as Role,
        },
      );
      res.setHeader("Cache-Control", "no-store");
      sendSuccess(res, result, CaseSuggestionsResponseSchema);
    } catch (error) {
      next(error);
    }
  }
}

export const caseSuggestionController = new CaseSuggestionController();
