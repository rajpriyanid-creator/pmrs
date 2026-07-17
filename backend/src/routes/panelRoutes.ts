import { Router } from "express";
import * as ctrl from "../controllers/panelController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { createReviewPanelSchema, updateVivaPanelSchema } from "../validators/panelValidators";

const router = Router();
router.use(requireAuth());

router.get("/review-panels", requireRole("admin", "assistant", "coordinator", "panel"), ctrl.listReviewPanels);
router.post("/review-panels", requireRole("admin"), validate(createReviewPanelSchema), ctrl.upsertReviewPanel);

router.get("/viva-panel/mine", requireRole("coordinator"), ctrl.getMyVivaPanel);
router.patch("/viva-panel/mine", requireRole("coordinator"), validate(updateVivaPanelSchema), ctrl.updateMyVivaPanel);

export default router;
