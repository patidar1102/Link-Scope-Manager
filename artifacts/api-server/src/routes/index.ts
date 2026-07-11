import { Router, type IRouter } from "express";
import healthRouter from "./health";
import linksRouter from "./links";
import analyticsRouter from "./analytics";
import { apiRateLimiter } from "../middlewares/rateLimit";

const router: IRouter = Router();

router.use(healthRouter);
router.use(apiRateLimiter, linksRouter);
router.use(apiRateLimiter, analyticsRouter);

export default router;
