import { Router } from "express";
import * as ctrl from "../controllers/reportController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { uploadSingle } from "../middleware/upload";

const router = Router();
router.use(requireAuth());

router.get("/:teamId", requireRole("admin", "assistant", "coordinator", "guide", "panel", "student"), ctrl.getFinalReport);
router.post("/", requireRole("student"), uploadSingle("document", "report"), ctrl.uploadFinalReport);
router.patch("/:teamId/approve", requireRole("guide"), ctrl.approveFinalReport);

export default router;
