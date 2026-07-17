import { Router } from "express";
import * as ctrl from "../controllers/notificationController";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth());

router.get("/", ctrl.listMyNotifications);
router.patch("/:id/read", ctrl.markNotificationRead);
router.patch("/read-all", ctrl.markAllNotificationsRead);

export default router;
