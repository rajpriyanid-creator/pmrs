import { Router } from "express";
import * as ctrl from "../controllers/assignmentController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { batchAssignmentSchema, autoAssignSchema } from "../validators/assignmentValidators";

const router = Router();
router.use(requireAuth(), requireRole("admin", "assistant"));

router.get("/", ctrl.getAssignments);
router.get("/workload", ctrl.getFacultyWorkload);
router.post("/batch", requireRole("admin"), validate(batchAssignmentSchema), ctrl.batchUpdateAssignments);
router.post("/auto-assign", requireRole("admin"), validate(autoAssignSchema), ctrl.autoAssignGuides);

export default router;
