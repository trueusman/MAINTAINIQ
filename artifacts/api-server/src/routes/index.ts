import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import techniciansRouter from "./technicians";
import assetsRouter from "./assets";
import publicRouter from "./public";
import aiRouter from "./ai";
import issuesRouter from "./issues";
import maintenanceRouter from "./maintenance";
import historyRouter from "./history";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(techniciansRouter);
router.use(assetsRouter);
router.use(publicRouter);
router.use(aiRouter);
router.use(issuesRouter);
router.use(maintenanceRouter);
router.use(historyRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);
router.use(storageRouter);

export default router;
