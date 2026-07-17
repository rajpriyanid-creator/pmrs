import { Router } from "express";
import * as ctrl from "../controllers/configController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

const router = Router();
router.use(requireAuth());

router.get("/", ctrl.getConfig); // visible to every authenticated role (max team size etc. shown at login)
router.patch("/", requireRole("admin"), ctrl.updateConfig);

export default router;
