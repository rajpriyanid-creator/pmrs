import { Router } from "express";
import * as ctrl from "../controllers/signatureController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { uploadSingle } from "../middleware/upload";

const router = Router();
router.use(requireAuth(), requireRole("admin", "coordinator"));

router.get("/", ctrl.listMySignatures);
router.post("/", uploadSingle("image", "signature"), ctrl.uploadSignature);
router.delete("/:id", ctrl.deleteSignature);

export default router;
