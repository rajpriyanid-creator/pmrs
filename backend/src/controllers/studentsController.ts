import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { Program } from '../models/Program';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { getPagination, paginated } from '../utils/pagination';
import { hashPassword } from '../utils/password';
import { getGuideCapacity } from '../services/guideCapacityService';
import { parseWorkbook, ColumnDef } from '../services/excelService';
import crypto from 'crypto';

const STUDENT_COLUMNS: ColumnDef[] = [
  { header: 'Roll No', key: 'rollNo', required: true },
  { header: 'Name', key: 'name', required: true },
  { header: 'Username', key: 'username', required: true },
  { header: 'Email', key: 'email', required: true },
];

export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const filter: Record<string, unknown> = {};
  if (req.query.program) filter.program = req.query.program;
  const [items, total] = await Promise.all([
    Student.find(filter).sort({ rollNo: 1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Student.countDocuments(filter),
  ]);
  res.json(paginated(items, total, pagination));
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const { name, rollNo, program, email, username } = req.body;
  const programDoc = await Program.findById(program);
  if (!programDoc) throw ApiError.badRequest('Unknown program');

  const exists = await Student.findOne({ $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }] });
  if (exists) throw ApiError.conflict('A student with this username or email already exists');

  const tempPassword = crypto.randomBytes(6).toString('base64url');
  const passwordHash = await hashPassword(tempPassword);

  const student = await Student.create({
    name,
    rollNo: rollNo.toUpperCase(),
    program,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    passwordHash,
  });

  res.status(201).json({ student: { ...student.toObject(), passwordHash: undefined }, tempPassword });
});

export const importStudentsCsv = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const { program } = req.body as { program: string };
  const programDoc = await Program.findById(program);
  if (!programDoc) throw ApiError.badRequest('Unknown program');

  const rows = await parseWorkbook(req.file.buffer, STUDENT_COLUMNS);
  const created: string[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const username = String(row.username).trim().toLowerCase();
      const email = String(row.email).trim().toLowerCase();
      const exists = await Student.findOne({ $or: [{ username }, { email }] });
      if (exists) throw new Error('Username or email already exists');

      const tempPassword = crypto.randomBytes(6).toString('base64url');
      const passwordHash = await hashPassword(tempPassword);

      const doc = await Student.create({
        name: String(row.name).trim(),
        rollNo: String(row.rollNo).trim().toUpperCase(),
        program,
        email,
        username,
        passwordHash,
      });
      created.push(doc.username);
    } catch (err) {
      errors.push({ row: i + 2, message: (err as Error).message });
    }
  }

  res.status(errors.length && !created.length ? 400 : 201).json({ createdCount: created.length, created, errors });
});

/** GET /students/guides — availability list for the Student login (spec 6.3). */
export const getGuideAvailability = asyncHandler(async (req: Request, res: Response) => {
  const programId = req.auth!.programId;
  if (!programId) throw ApiError.badRequest('No program context');
  const program = await Program.findById(programId);
  if (!program) throw ApiError.notFound('Program not found');

  const guides = await Faculty.find({ isActive: true }).select('name designation guideLimits').lean();
  const withCapacity = await Promise.all(
    guides.map(async (g) => {
      const capacity = await getGuideCapacity(g._id, g.guideLimits);
      const relevant = program.type === 'UG' ? capacity.ug : capacity.pg;
      return { guideId: g._id, name: g.name, designation: g.designation, remaining: relevant.remaining, limit: relevant.limit };
    })
  );

  res.json({ maxTeamSize: program.maxTeamSize, guides: withCapacity });
});
