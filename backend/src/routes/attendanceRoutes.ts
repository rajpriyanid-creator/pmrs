import { Router } from "express";
import * as ctrl from "../controllers/attendanceController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { submitAttendanceSchema } from "../validators/attendanceValidators";

const router = Router();
router.use(requireAuth());

// Write access is coordinator-only (Section 6.6); everyone with visibility can read.
router.get("/", requireRole("admin", "assistant", "coordinator", "guide", "panel", "student"), ctrl.getAttendance);
router.post("/", requireRole("coordinator"), validate(submitAttendanceSchema), ctrl.submitAttendance);

export default router;
