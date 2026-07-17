import { Router } from "express";
import * as ctrl from "../controllers/documentController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { uploadSingle } from "../middleware/upload";

const router = Router();
router.use(requireAuth());

router.get("/templates", requireRole("admin", "coordinator"), ctrl.listTemplates);
router.post("/templates", requireRole("admin"), uploadSingle("docx", "template"), ctrl.uploadTemplate);

router.post("/generate", requireRole("coordinator", "admin"), ctrl.generateDocument);
router.get("/:id/download", requireRole("admin", "coordinator", "assistant"), ctrl.downloadGeneratedDocument);
router.get("/:id/html", requireRole("coordinator", "admin"), ctrl.convertGeneratedToHtml);
router.put("/:id/html", requireRole("coordinator", "admin"), ctrl.saveEditedHtmlAsDocx);

export default router;
