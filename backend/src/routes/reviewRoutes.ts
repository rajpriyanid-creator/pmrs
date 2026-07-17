import { Router } from "express";
import * as ctrl from "../controllers/reviewController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { scheduleReviewSchema, updateReviewSchema } from "../validators/reviewValidators";

const router = Router();
router.use(requireAuth());

router.get("/", requireRole("admin", "assistant", "coordinator", "guide", "panel", "student"), ctrl.listReviews);
router.post("/", requireRole("coordinator"), validate(scheduleReviewSchema), ctrl.scheduleReview);
router.patch("/:id", requireRole("coordinator"), validate(updateReviewSchema), ctrl.updateReview);

export default router;
