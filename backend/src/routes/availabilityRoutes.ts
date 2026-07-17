import { Router } from "express";
import * as ctrl from "../controllers/availabilityController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { submitAvailabilitySchema, autoGenerateScheduleSchema } from "../validators/availabilityValidators";

const router = Router();
router.use(requireAuth());

router.get("/mine", requireRole("guide", "panel"), ctrl.getMyAvailability);
router.post("/", requireRole("guide", "panel"), validate(submitAvailabilitySchema), ctrl.submitAvailability);

router.post("/auto-schedule", requireRole("coordinator", "admin"), validate(autoGenerateScheduleSchema), ctrl.requestAutoSchedule);
router.post("/auto-schedule/sync", requireRole("coordinator", "admin"), validate(autoGenerateScheduleSchema), ctrl.runAutoScheduleSync);

export default router;
