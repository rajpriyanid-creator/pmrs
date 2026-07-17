import { Router } from "express";
import * as ctrl from "../controllers/teamController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { createTeamSchema, inviteSchema, respondInviteSchema, lockTeamSchema } from "../validators/teamValidators";

const router = Router();
router.use(requireAuth());

router.get("/", requireRole("admin", "assistant", "coordinator", "guide", "panel", "student"), ctrl.listTeams);
router.post("/", requireRole("student"), validate(createTeamSchema), ctrl.createTeam);
router.post("/:teamId/invite", requireRole("student"), validate(inviteSchema), ctrl.inviteToTeam);
router.post("/invites/respond", requireRole("student"), validate(respondInviteSchema), ctrl.respondToInvite);
router.post("/lock", requireRole("student"), validate(lockTeamSchema), ctrl.lockTeam);

router.delete("/", requireRole("admin"), ctrl.bulkDeleteTeams);
router.delete("/solo", requireRole("admin"), ctrl.bulkDeleteSoloTeams);

export default router;
