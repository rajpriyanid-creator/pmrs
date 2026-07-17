import { Request, Response } from 'express';
import { Faculty } from '../models/Faculty';
import { Student } from '../models/Student';
import { RefreshToken } from '../models/RefreshToken';
import { ReviewPanel, VivaPanel } from '../models/Panel';
import { Team } from '../models/Team';
import { Program } from '../models/Program';
import { comparePassword, hashPassword, isPasswordStrongEnough } from '../utils/password';
import {
  hashRefreshToken,
  ScopedRole,
  signAccessToken,
  signIdentityToken,
  signRefreshToken,
  verifyAccessLikeToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { generateOtp, hashOtp, verifyOtp as verifyOtpValue } from '../services/otpService';
import { sendMail } from '../services/emailService';

const REFRESH_COOKIE = 'prms_refresh';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict' as const,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
}

async function issueSession(res: Response, userId: string, userModel: 'Faculty' | 'Student') {
  const { token, hash, expiresAt } = signRefreshToken(userId, userModel);
  await RefreshToken.create({ userId, userModel, tokenHash: hash, expiresAt });
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };
  const uname = username.trim().toLowerCase();

  const faculty = await Faculty.findOne({ username: uname, isActive: true }).select('+passwordHash');
  if (faculty) {
    const ok = await comparePassword(password, faculty.passwordHash);
    if (!ok) throw ApiError.unauthorized('Invalid username or password');
    const identityToken = signIdentityToken(faculty._id.toString(), 'Faculty');
    return res.json({
      needsRoleSelection: true,
      identityToken,
      name: faculty.name,
      mustChangePassword: faculty.mustChangePassword,
    });
  }

  const student = await Student.findOne({ username: uname }).select('+passwordHash');
  if (student) {
    const ok = await comparePassword(password, student.passwordHash);
    if (!ok) throw ApiError.unauthorized('Invalid username or password');
    const accessToken = signAccessToken({
      userId: student._id.toString(),
      userModel: 'Student',
      role: 'student',
      programId: student.program.toString(),
      tokenVersion: student.refreshTokenVersion,
    });
    await issueSession(res, student._id.toString(), 'Student');
    return res.json({
      needsRoleSelection: false,
      accessToken,
      mustChangePassword: student.mustChangePassword,
      profile: { userId: student._id.toString(), name: student.name, role: 'student', programId: student.program },
    });
  }

  throw ApiError.unauthorized('Invalid username or password');
});

/** GET /auth/roles — role×program list, computed dynamically per spec 6.1. */
export const getAvailableRoles = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) throw ApiError.unauthorized('Missing identity token');

  let payload;
  try {
    payload = verifyAccessLikeToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired identity token');
  }
  if (payload.kind !== 'identity' || payload.userModel !== 'Faculty') {
    throw ApiError.unauthorized('Role selection is only applicable to faculty logins');
  }

  const faculty = await Faculty.findById(payload.sub);
  if (!faculty || !faculty.isActive) throw ApiError.unauthorized('Account not found');

  const programs = await Program.find().lean();
  const options: { role: ScopedRole; programId: string | null; programLabel: string }[] = [];

  if (faculty.isAdmin) {
    options.push({ role: 'admin', programId: null, programLabel: 'All Programs' });
  }
  if (faculty.isAssistant) {
    options.push({ role: 'assistant', programId: null, programLabel: 'All Programs' });
  }

  // Guide is always available for every program (spec 6.1).
  for (const program of programs) {
    options.push({ role: 'guide', programId: program._id.toString(), programLabel: program.name });
  }

  // Coordinator/Panel only if currently assigned for that program.
  const coordinatorPanels = await ReviewPanel.find({ coordinatorId: faculty._id }).select('program').lean();
  const coordinatorProgramIds = new Set(coordinatorPanels.map((p) => p.program.toString()));
  const memberPanels = await ReviewPanel.find({ memberIds: faculty._id }).select('program').lean();
  const panelProgramIds = new Set(memberPanels.map((p) => p.program.toString()));

  for (const program of programs) {
    const pid = program._id.toString();
    if (coordinatorProgramIds.has(pid)) {
      options.push({ role: 'coordinator', programId: pid, programLabel: program.name });
    }
    if (panelProgramIds.has(pid)) {
      options.push({ role: 'panel', programId: pid, programLabel: program.name });
    }
  }

  res.json({ name: faculty.name, options, mustChangePassword: faculty.mustChangePassword });
});

/** POST /auth/select-role — exchanges identity token + chosen role/program for a scoped session. */
export const selectRole = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const { role, programId } = req.body as { role: ScopedRole; programId: string | null };
  if (!token) throw ApiError.unauthorized('Missing identity token');

  let payload;
  try {
    payload = verifyAccessLikeToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired identity token');
  }
  if (payload.kind !== 'identity' || payload.userModel !== 'Faculty') {
    throw ApiError.unauthorized('Invalid identity token');
  }

  const faculty = await Faculty.findById(payload.sub);
  if (!faculty || !faculty.isActive) throw ApiError.unauthorized('Account not found');

  // Re-validate the requested role/program is actually permitted — never trust the client's claim.
  if (role === 'admin' && !faculty.isAdmin) throw ApiError.forbidden('Not an admin account');
  if (role === 'assistant' && !faculty.isAssistant) throw ApiError.forbidden('Not an assistant account');
  if (role === 'guide') {
    const program = await Program.findById(programId);
    if (!program) throw ApiError.badRequest('Unknown program');
  }
  if (role === 'coordinator') {
    const has = await ReviewPanel.exists({ coordinatorId: faculty._id, program: programId });
    if (!has) throw ApiError.forbidden('You do not coordinate any team in this program');
  }
  if (role === 'panel') {
    const has = await ReviewPanel.exists({ memberIds: faculty._id, program: programId });
    if (!has) throw ApiError.forbidden('You are not on a panel for this program');
  }

  const accessToken = signAccessToken({
    userId: faculty._id.toString(),
    userModel: 'Faculty',
    role,
    programId: role === 'admin' || role === 'assistant' ? null : programId,
    tokenVersion: faculty.refreshTokenVersion,
  });
  await issueSession(res, faculty._id.toString(), 'Faculty');

  res.json({
    accessToken,
    mustChangePassword: faculty.mustChangePassword,
    profile: { userId: faculty._id.toString(), name: faculty.name, role, programId },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) throw ApiError.unauthorized('No refresh token');

  let wrapper;
  try {
    wrapper = verifyRefreshToken(raw);
  } catch {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const hash = hashRefreshToken(wrapper.raw);
  const stored = await RefreshToken.findOne({ tokenHash: hash });

  if (!stored || stored.revoked) {
    if (stored) {
      await RefreshToken.updateMany({ userId: stored.userId, userModel: stored.userModel }, { revoked: true });
    }
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    throw ApiError.unauthorized('Refresh token invalid — please log in again');
  }
  if (stored.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized('Refresh token expired');
  }

  // Rotate: revoke old, issue new.
  const { token: newRaw, hash: newHash, expiresAt } = signRefreshToken(wrapper.sub, wrapper.userModel);
  stored.revoked = true;
  stored.replacedByHash = newHash;
  await stored.save();
  await RefreshToken.create({ userId: wrapper.sub, userModel: wrapper.userModel, tokenHash: newHash, expiresAt });
  res.cookie(REFRESH_COOKIE, newRaw, refreshCookieOptions());

  const { role, programId } = req.body as { role?: ScopedRole; programId?: string | null };

  if (wrapper.userModel === 'Student') {
    const student = await Student.findById(wrapper.sub);
    if (!student) throw ApiError.unauthorized('Account not found');
    const accessToken = signAccessToken({
      userId: student._id.toString(),
      userModel: 'Student',
      role: 'student',
      programId: student.program.toString(),
      tokenVersion: student.refreshTokenVersion,
    });
    return res.json({ accessToken });
  }

  const faculty = await Faculty.findById(wrapper.sub);
  if (!faculty || !faculty.isActive) throw ApiError.unauthorized('Account not found');
  if (!role) throw ApiError.badRequest('role and programId are required to refresh a faculty session');

  const accessToken = signAccessToken({
    userId: faculty._id.toString(),
    userModel: 'Faculty',
    role,
    programId: role === 'admin' || role === 'assistant' ? null : programId ?? null,
    tokenVersion: faculty.refreshTokenVersion,
  });
  res.json({ accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (raw) {
    try {
      const wrapper = verifyRefreshToken(raw);
      const hash = hashRefreshToken(wrapper.raw);
      await RefreshToken.updateOne({ tokenHash: hash }, { revoked: true });
    } catch {
      // ignore malformed token on logout
    }
  }
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  res.json({ ok: true });
});

// ─── Forgot-password / OTP flow ──────────────────────────────────────────────

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  if (!email) throw ApiError.badRequest('Email is required');

  const normalised = email.trim().toLowerCase();
  // Look in both Faculty and Student
  const faculty = await Faculty.findOne({ email: normalised }).select('+otpHash +otpExpiresAt');
  const student = !faculty ? await Student.findOne({ email: normalised }) : null;

  // Always return 200 to avoid email enumeration
  if (!faculty && !student) {
    return res.json({ ok: true, message: 'If that email exists, an OTP has been sent.' });
  }

  const { otp, hash, expiresAt } = generateOtp();

  if (faculty) {
    faculty.otpHash = hash;
    faculty.otpExpiresAt = expiresAt;
    await faculty.save();
  } else if (student) {
    // Students don't have OTP fields yet, just log for now; they use faculty system
    // (Students can't self-reset without admin; return early gracefully)
    return res.json({ ok: true, message: 'If that email exists, an OTP has been sent.' });
  }

  await sendMail({
    to: normalised,
    subject: 'PRMS — Password Reset OTP',
    text: `Your one-time password for PRMS is: ${otp}\n\nThis OTP expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `<p>Your PRMS password reset OTP is:</p><h2>${otp}</h2><p>This expires in <strong>10 minutes</strong>. If you did not request this, ignore this email.</p>`,
  });

  res.json({ ok: true, message: 'If that email exists, an OTP has been sent.' });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email: string; otp: string };
  if (!email || !otp) throw ApiError.badRequest('email and otp are required');

  const normalised = email.trim().toLowerCase();
  const faculty = await Faculty.findOne({ email: normalised }).select('+otpHash +otpExpiresAt');
  if (!faculty || !faculty.otpHash || !faculty.otpExpiresAt) {
    throw ApiError.badRequest('OTP is invalid or expired');
  }

  const valid = verifyOtpValue(otp.trim(), faculty.otpHash, faculty.otpExpiresAt);
  if (!valid) throw ApiError.badRequest('OTP is invalid or expired');

  // Issue a short-lived reset token (reuse identity-token kind)
  const resetToken = signIdentityToken(faculty._id.toString(), 'Faculty');
  // Invalidate OTP immediately
  faculty.otpHash = null;
  faculty.otpExpiresAt = null;
  await faculty.save();

  res.json({ ok: true, resetToken });
});

export const resetPasswordWithOtp = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const { password } = req.body as { password: string };
  if (!token) throw ApiError.unauthorized('Missing reset token');
  if (!password) throw ApiError.badRequest('New password is required');
  if (!isPasswordStrongEnough(password)) {
    throw ApiError.badRequest('Password must be at least 8 characters and include a letter and a number');
  }

  let payload;
  try {
    payload = verifyAccessLikeToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired reset token');
  }
  if (payload.kind !== 'identity') throw ApiError.unauthorized('Invalid reset token');

  const faculty = await Faculty.findById(payload.sub).select('+passwordHash');
  if (!faculty) throw ApiError.notFound('Account not found');

  faculty.passwordHash = await hashPassword(password);
  faculty.mustChangePassword = false;
  faculty.refreshTokenVersion += 1; // invalidate all existing sessions
  await faculty.save();

  res.json({ ok: true });
});

// ─── In-session password change (old-password confirmation) ──────────────────

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
  if (!oldPassword || !newPassword) throw ApiError.badRequest('oldPassword and newPassword are required');
  if (!isPasswordStrongEnough(newPassword)) {
    throw ApiError.badRequest('New password must be at least 8 characters and include a letter and a number');
  }

  const auth = req.auth!;
  let passwordHash: string;
  let save: () => Promise<void>;

  if (auth.userModel === 'Faculty') {
    const faculty = await Faculty.findById(auth.userId).select('+passwordHash');
    if (!faculty) throw ApiError.notFound('Account not found');
    const ok = await comparePassword(oldPassword, faculty.passwordHash);
    if (!ok) throw ApiError.badRequest('Old password is incorrect');
    faculty.passwordHash = await hashPassword(newPassword);
    faculty.mustChangePassword = false;
    faculty.refreshTokenVersion += 1;
    save = async () => { await faculty.save(); };
    passwordHash = faculty.passwordHash;
  } else {
    const student = await Student.findById(auth.userId).select('+passwordHash');
    if (!student) throw ApiError.notFound('Account not found');
    const ok = await comparePassword(oldPassword, student.passwordHash);
    if (!ok) throw ApiError.badRequest('Old password is incorrect');
    student.passwordHash = await hashPassword(newPassword);
    student.mustChangePassword = false;
    student.refreshTokenVersion += 1;
    save = async () => { await student.save(); };
    passwordHash = student.passwordHash;
  }

  await save();
  // Revoke all existing refresh tokens so they must log in again with the new password
  await RefreshToken.updateMany({ userId: auth.userId, userModel: auth.userModel }, { revoked: true });
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());

  res.json({ ok: true, message: 'Password changed. Please log in again.' });
});

// ─── Self-service Panel Member Registration ───────────────────────────────────

export const registerPanel = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, username, password, designation, seniority, memberType } = req.body as {
    name: string;
    email: string;
    username: string;
    password: string;
    designation: string;
    seniority: number;
    memberType: 'internal' | 'external';
  };

  if (!name || !email || !username || !password) {
    throw ApiError.badRequest('name, email, username and password are required');
  }
  if (!isPasswordStrongEnough(password)) {
    throw ApiError.badRequest('Password must be at least 8 characters and include a letter and a number');
  }
  if (!['internal', 'external'].includes(memberType)) {
    throw ApiError.badRequest('memberType must be internal or external');
  }

  const exists = await Faculty.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });
  if (exists) throw ApiError.conflict('An account with this username or email already exists');

  const passwordHash = await hashPassword(password);
  const faculty = await Faculty.create({
    name: name.trim(),
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    designation: designation?.trim() || 'Panel Member',
    seniority: Number(seniority) || 99,
    memberType,
    passwordHash,
    isAdmin: false,
    isAssistant: false,
    mustChangePassword: false,
  });

  res.status(201).json({
    ok: true,
    faculty: {
      _id: faculty._id,
      name: faculty.name,
      username: faculty.username,
      email: faculty.email,
      memberType: faculty.memberType,
    },
  });
});
