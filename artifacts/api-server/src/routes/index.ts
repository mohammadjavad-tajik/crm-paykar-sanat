import { Router, type IRouter } from "express";
import healthRouter from "./health";
import customersRouter from "./customers";
import jobsRouter from "./jobs";
import invoicesRouter from "./invoices";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";
import backupRouter from "./backup";
import suppliersRouter from "./suppliers";
import equipmentRouter from "./equipment";
import panelsRouter from "./panels";

const router: IRouter = Router();

router.use(healthRouter);
router.use(customersRouter);
router.use(jobsRouter);
router.use(invoicesRouter);
router.use(settingsRouter);
router.use(dashboardRouter);
router.use(backupRouter);
router.use(suppliersRouter);
router.use(equipmentRouter);
router.use(panelsRouter);

export default router;
