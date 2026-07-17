import { Router } from "express";
import { Program } from "../models/Program";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { recordAudit } from "../services/auditService";

const router = Router();

router.get("/", asyncHandler(async (_req, res) => ok(res, await Program.find().lean())));

router.post(
  "/",
  requireAuth(),
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const program = await Program.create(req.body);
    await recordAudit(req, "program.create", "Program", String(program._id));
    return ok(res, program, 201);
  }),
);

export default router;
