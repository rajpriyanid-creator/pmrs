import { Router } from "express";
import * as ctrl from "../controllers/facultyController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { uploadSingle } from "../middleware/upload";
import { createFacultySchema, updateFacultySchema } from "../validators/facultyValidators";

const router = Router();
router.use(requireAuth(), requireRole("admin", "assistant"));

router.get("/", ctrl.listFaculty);
router.get("/export", ctrl.exportFacultyExcel);
router.post("/", requireRole("admin"), validate(createFacultySchema), ctrl.createFaculty);
router.post("/import", requireRole("admin"), uploadSingle("excel"), ctrl.importFacultyCsv);
router.patch("/:id", requireRole("admin"), validate(updateFacultySchema), ctrl.updateFaculty);
router.delete("/:id", requireRole("admin"), ctrl.deleteFaculty);
router.delete("/", requireRole("admin"), ctrl.bulkDeleteFaculty);

export default router;
