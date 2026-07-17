import type { Request, Response } from "express";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { asyncHandler } from "../utils/asyncHandler";
import { ok, paginated } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";
import { Student } from "../models/Student";
import { hashPassword } from "../utils/password";
import { parseExcelStrict } from "../services/excelService";
import { recordAudit } from "../services/auditService";

export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const filter: Record<string, unknown> = {};
  if (req.query.program) filter.program = req.query.program;

  const [items, total] = await Promise.all([
    Student.find(filter).select("-passwordHash").skip((page - 1) * limit).limit(limit).lean(),
    Student.countDocuments(filter),
  ]);
  return paginated(res, items, { page, limit, total });
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const { name, rollNo, program, email } = req.body;
  const username = rollNo.toLowerCase();
  const existing = await Student.findOne({ $or: [{ username }, { email }] });
  if (existing) throw ApiError.conflict("Roll number or email already registered");

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await hashPassword(tempPassword);
  const student = await Student.create({ name, rollNo, program, email, username, passwordHash, mustChangePassword: true });

  await recordAudit(req, "student.create", "Student", String(student._id));
  return ok(res, { id: student._id, tempPassword }, 201);
});

/** [FROM EXISTING SYSTEM] CSV bulk upload for students, parallel to the Faculty import flow. */
export const importStudentsCsv = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");
  const fileBuffer = await fs.readFile(req.file.path);
  const rows = parseExcelStrict(fileBuffer, ["name", "rollNo", "program", "email"]);

  const created: string[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const username = row.rollNo.toLowerCase();
      const existing = await Student.findOne({ $or: [{ username }, { email: row.email }] });
      if (existing) throw new Error("Duplicate roll number/email");

      const tempPassword = crypto.randomBytes(9).toString("base64url");
      const passwordHash = await hashPassword(tempPassword);
      const student = await Student.create({
        name: row.name, rollNo: row.rollNo, program: row.program, email: row.email,
        username, passwordHash, mustChangePassword: true,
      });
      created.push(String(student._id));
    } catch (err) {
      errors.push({ row: i + 2, message: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  await fs.unlink(req.file.path).catch(() => undefined);
  await recordAudit(req, "student.bulkImport", "Student", undefined, { createdCount: created.length, errorCount: errors.length });
  return ok(res, { createdCount: created.length, errors });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw ApiError.notFound("Student not found");
  await recordAudit(req, "student.delete", "Student", req.params.id);
  return ok(res, { deleted: true });
});

/** Bulk destructive operation - danger zone (Section 6.18). */
export const bulkDeleteStudents = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.program) filter.program = req.query.program;
  const result = await Student.deleteMany(filter);
  await recordAudit(req, "student.bulkDelete", "Student", undefined, { deletedCount: result.deletedCount });
  return ok(res, { deletedCount: result.deletedCount });
});

export const downloadStudentTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const csvContent = 'Roll No,Name,Email,Programme\n2026UG001,John Doe,john@example.com,UG\n2026PG001,Jane Smith,jane@example.com,MECSE\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student-template.csv"');
  return res.send(csvContent);
});
