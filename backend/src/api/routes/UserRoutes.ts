import AdminController from "../controllers/AdminController";
import PromiseRouter from "express-promise-router";

const router = PromiseRouter();

router.get("/doctors", AdminController.getAllDoctors);

router.get("/nurses", AdminController.getAllNurses);

export default router;
