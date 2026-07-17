import { Router } from "express";
import * as ctrl from "../controllers/analyticsController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth(), requireRole("admin", "assistant", "coordinator"));

router.get("/overview", ctrl.getProgramOverview);
router.get("/guide-workload", ctrl.getGuideWorkloadDistribution);

export default router;
