import { Request, Response } from 'express';
import { Faculty } from '../models/Faculty';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { getPagination, paginated } from '../utils/pagination';
import { hashPassword, isPasswordStrongEnough } from '../utils/password';
import { buildWorkbook, parseWorkbook, ColumnDef } from '../services/excelService';
import { recordAudit } from '../services/auditService';
import crypto from 'crypto';

const FACULTY_COLUMNS: ColumnDef[] = [
  { header: 'Seniority', key: 'seniority', required: true },
  { header: 'Name', key: 'name', required: true },
  { header: 'Username', key: 'username', required: true },
  { header: 'Email', key: 'email', required: true },
  { header: 'Designation', key: 'designation', required: true },
  { header: 'UG Guide Limit', key: 'ugLimit', required: false },
  { header: 'PG Guide Limit', key: 'pgLimit', required: false },
];

export const listFaculty = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const search = String(req.query.search ?? '').trim();
  const filter = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
    : {};

  const [items, total] = await Promise.all([
    Faculty.find(filter).sort({ seniority: 1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Faculty.countDocuments(filter),
  ]);
  res.json(paginated(items, total, pagination));
});

export const createFaculty = asyncHandler(async (req: Request, res: Response) => {
  const { name, username, email, designation, seniority, guideLimits, isAdmin, isAssistant } = req.body;
  const existing = await Faculty.findOne({ $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] });
  if (existing) throw ApiError.conflict('A faculty member with this username or email already exists');

  const tempPassword = crypto.randomBytes(6).toString('base64url');
  const passwordHash = await hashPassword(tempPassword);

  const faculty = await Faculty.create({
    name,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    designation,
    seniority,
    guideLimits: guideLimits ?? { ug: 0, pg: 0 },
    isAdmin: Boolean(isAdmin),
    isAssistant: Boolean(isAssistant),
    passwordHash,
  });

  await recordAudit(req.auth!, 'create', 'Faculty', faculty._id, { name, username });

  // Temp password returned once, out-of-band distribution is the institution's responsibility.
  res.status(201).json({ faculty: { ...faculty.toObject(), passwordHash: undefined }, tempPassword });
});

export const updateFaculty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = { ...req.body };
  delete updates.passwordHash;
  delete updates.username; // identity fields are immutable via this route
  delete updates.refreshTokenVersion;

  const faculty = await Faculty.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!faculty) throw ApiError.notFound('Faculty not found');

  await recordAudit(req.auth!, 'update', 'Faculty', faculty._id, updates);
  res.json({ faculty });
});

export const importFacultyCsv = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const rows = await parseWorkbook(req.file.buffer, FACULTY_COLUMNS);

  const created: string[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const seniority = Number(row.seniority);
      if (!Number.isFinite(seniority) || seniority < 1) throw new Error('Invalid seniority value');

      const username = String(row.username).trim().toLowerCase();
      const email = String(row.email).trim().toLowerCase();
      const exists = await Faculty.findOne({ $or: [{ username }, { email }] });
      if (exists) throw new Error(`Username or email already exists`);

      const tempPassword = crypto.randomBytes(6).toString('base64url');
      const passwordHash = await hashPassword(tempPassword);

      const doc = await Faculty.create({
        name: String(row.name).trim(),
        username,
        email,
        designation: String(row.designation).trim(),
        seniority,
        guideLimits: { ug: Number(row.ugLimit) || 0, pg: Number(row.pgLimit) || 0 },
        passwordHash,
      });
      created.push(doc.username);
    } catch (err) {
      errors.push({ row: i + 2, message: (err as Error).message });
    }
  }

  await recordAudit(req.auth!, 'import', 'Faculty', 'bulk', { createdCount: created.length, errorCount: errors.length });
  res.status(errors.length && !created.length ? 400 : 201).json({ createdCount: created.length, created, errors });
});

export const exportFacultyTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await buildWorkbook('Faculty Template', FACULTY_COLUMNS, []);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="faculty-import-template.xlsx"');
  res.send(buffer);
});

export const exportFacultyList = asyncHandler(async (_req: Request, res: Response) => {
  const faculty = await Faculty.find().sort({ seniority: 1 }).lean();
  const rows = faculty.map((f) => ({
    seniority: f.seniority,
    name: f.name,
    username: f.username,
    email: f.email,
    designation: f.designation,
    ugLimit: f.guideLimits.ug,
    pgLimit: f.guideLimits.pg,
  }));
  const buffer = await buildWorkbook('Faculty', FACULTY_COLUMNS, rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="faculty.xlsx"');
  res.send(buffer);
});

export function assertStrongPasswordIfProvided(password?: string) {
  if (password && !isPasswordStrongEnough(password)) {
    throw ApiError.badRequest('Password must be at least 8 characters and include a letter and a number');
  }
}
