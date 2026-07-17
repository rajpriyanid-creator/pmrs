import { Router } from "express";
import * as ctrl from "../controllers/marksController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { submitMarksSchema } from "../validators/marksValidators";

const router = Router();
router.use(requireAuth());

router.get("/", requireRole("admin", "assistant", "coordinator", "guide", "panel", "student"), ctrl.getMarksForReview);
router.get("/:teamId/:studentId/overall", requireRole("admin", "assistant", "coordinator", "guide", "panel", "student"), ctrl.getStudentOverallMarks);
router.post("/", requireRole("guide", "panel", "coordinator"), validate(submitMarksSchema), ctrl.submitMarks);

export default router;
