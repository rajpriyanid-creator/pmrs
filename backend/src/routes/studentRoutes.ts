import { Router } from "express";
import * as ctrl from "../controllers/studentController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { uploadSingle } from "../middleware/upload";
import { createStudentSchema } from "../validators/facultyValidators";

const router = Router();
router.use(requireAuth(), requireRole("admin", "assistant", "coordinator"));

router.get("/", ctrl.listStudents);
router.get("/template", ctrl.downloadStudentTemplate);
router.post("/", requireRole("admin"), validate(createStudentSchema), ctrl.createStudent);
router.post("/import", requireRole("admin"), uploadSingle("excel"), ctrl.importStudentsCsv);
router.delete("/:id", requireRole("admin"), ctrl.deleteStudent);
router.delete("/", requireRole("admin"), ctrl.bulkDeleteStudents);

export default router;
