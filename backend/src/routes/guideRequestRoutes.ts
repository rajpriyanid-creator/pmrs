import { Router } from "express";
import * as ctrl from "../controllers/guideRequestController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { guideRequestSchema, guideRequestDecisionSchema } from "../validators/teamValidators";

const router = Router();
router.use(requireAuth());

router.post("/", requireRole("student"), validate(guideRequestSchema), ctrl.createGuideRequest);
router.get("/", requireRole("guide"), ctrl.listMyGuideRequests);
router.get("/limits", requireRole("guide"), ctrl.getGuideLimits);
router.patch("/:id/decision", requireRole("guide"), validate(guideRequestDecisionSchema), ctrl.decideGuideRequest);

export default router;
