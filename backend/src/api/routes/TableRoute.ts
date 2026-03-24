import { Response } from "express";
import authMiddleware, { AuthRequest } from "../middlewares/AuthMiddleware";
import TableController from "../controllers/TableController";
import PromiseRouter from "express-promise-router";

const router = PromiseRouter();

router.post(
  "/getTableData",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    TableController.getTableData(req, res);
  }
);

export default router;
