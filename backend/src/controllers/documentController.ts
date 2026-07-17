import { Request, Response } from 'express';
import { VivaPanel, ReviewPanel } from '../models/Panel';
import { Team } from '../models/Team';
import { Faculty } from '../models/Faculty';
import { Signature } from '../models/Signature';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { generateLetterPDF } from '../utils/pdfGenerator';
import path from 'path';
import fs from 'fs';

const TEMPLATES_DIR = path.join(__dirname, '../../templates');

interface LetterData {
  teamName: string;
  programName?: string;
  guideName: string;
  reviewDate?: string;
  externalName?: string;
  externalAffiliation?: string;
  externalEmail?: string;
  coordinatorName?: string;
  signatureBase64?: string;
}

/**
 * Generates a letter using a simple template substitution.
 * Returns a Buffer containing the generated content.
 * NOTE: For production, replace with docxtemplater + pizzip for .docx support.
 */
async function generateLetterContent(templateName: string, data: LetterData): Promise<{ content: string; mimeType: string; filename: string }> {
  // Try to load the .docx template; fall back to a plain-text representation
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.txt`);
  let template: string;
  try {
    template = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf-8') : getDefaultTemplate(templateName);
  } catch {
    template = getDefaultTemplate(templateName);
  }

  // Simple mustache-style substitution {{ key }}
  let content = template;
  for (const [key, value] of Object.entries(data)) {
    content = content.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value ?? ''));
  }

  return {
    content,
    mimeType: 'text/plain',
    filename: `${templateName}-${Date.now()}.txt`,
  };
}

function getDefaultTemplate(templateName: string): string {
  const templates: Record<string, string> = {
    viva_letter: `VIVA EXAMINATION LETTER

Date: {{ reviewDate }}

To,
{{ externalName }}
{{ externalAffiliation }}
{{ externalEmail }}

Dear Sir/Madam,

We are pleased to invite you as an External Examiner for the Viva Examination of team "{{ teamName }}".

Guide: {{ guideName }}
Coordinator: {{ coordinatorName }}

We request you to kindly attend and participate in the examination.

Regards,
{{ coordinatorName }}
`,
    internal_examiner_letter: `INTERNAL EXAMINER APPOINTMENT LETTER

Date: {{ reviewDate }}

Team: {{ teamName }}
Guide: {{ guideName }}
Coordinator: {{ coordinatorName }}

This letter confirms your appointment as Internal Examiner for the above team's project review.

Regards,
{{ coordinatorName }}
`,
    external_examiner_letter: `EXTERNAL EXAMINER CLAIM LETTER

Date: {{ reviewDate }}

To,
{{ externalName }}
{{ externalAffiliation }}

This letter certifies that {{ externalName }} served as External Examiner for team "{{ teamName }}" and is eligible to claim honorarium as per institutional norms.

Authorized by: {{ coordinatorName }}
`,
    chairman_letter: `CHAIRMAN'S APPOINTMENT LETTER

Date: {{ reviewDate }}

Team: {{ teamName }}
Guide: {{ guideName }}

You are hereby appointed as Chairman for the Viva panel of the above team.

Regards,
{{ coordinatorName }}
`,
  };
  return templates[templateName] ?? `Letter: ${templateName}\n\nTeam: {{ teamName }}\nDate: {{ reviewDate }}`;
}

/** GET /documents/templates — list available letter templates. */
export const listTemplates = asyncHandler(async (_req: Request, res: Response) => {
  const templates = [
    { id: 'viva_letter', label: 'Viva Letter (External Examiner Invitation)' },
    { id: 'internal_examiner_letter', label: 'Internal Examiner Appointment Letter' },
    { id: 'external_examiner_letter', label: 'External Examiner Claim Letter' },
    { id: 'chairman_letter', label: 'Chairman Appointment Letter' },
  ];
  res.json({ templates });
});

import { Types } from 'mongoose';

/** GET/POST /documents/generate/:type — generate a letter for a team as PDF. */
export const generateLetter = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const validTypes = ['viva_letter', 'internal_examiner_letter', 'external_examiner_letter', 'chairman_letter'];
  if (!validTypes.includes(type)) throw ApiError.badRequest(`Unknown letter type: ${type}`);

  const teamId = (req.query.teamId || req.body?.teamId) as string;
  const reviewDate = (req.query.reviewDate || req.body?.reviewDate) as string;
  if (!teamId || !Types.ObjectId.isValid(teamId)) {
    throw ApiError.badRequest('A valid teamId is required');
  }

  const team = await Team.findById(teamId)
    .populate('guideId', 'name')
    .populate('students', 'name rollNo')
    .populate('program', 'name code')
    .lean() as any;
  if (!team) throw ApiError.notFound('Team not found');

  // Fetch coordinator for this team via ReviewPanel
  const panel = await ReviewPanel.findOne({ teamIds: new Types.ObjectId(teamId) })
    .populate('coordinatorId', 'name')
    .lean() as any;

  // Fetch viva panel external members if applicable
  const vivaPanel = await VivaPanel.findOne({ teamIds: new Types.ObjectId(teamId) }).lean() as any;

  // Fetch signature for coordinator or admin
  const sigOr: any[] = [{ role: { $regex: /coordinator|hod/i } }];
  if (req.auth?.userId && Types.ObjectId.isValid(req.auth.userId)) {
    sigOr.push({ ownerId: new Types.ObjectId(req.auth.userId) });
  }
  const signature = await Signature.findOne({ $or: sigOr }).select('imageBase64').lean();

  const labels: Record<string, string> = {
    viva_letter: 'Viva Examination Invitation Letter',
    internal_examiner_letter: 'Internal Examiner Appointment Letter',
    external_examiner_letter: 'External Examiner Remuneration & Claim Letter',
    chairman_letter: 'Viva Panel Chairman Appointment Notice',
  };

  const formattedStudents = (team.students || []).map((s: any) => {
    if (typeof s === 'object' && s !== null) {
      return { name: s.name || 'Student', rollNo: s.rollNo || '' };
    }
    return { name: String(s), rollNo: '' };
  });

  const pdfBuffer = await generateLetterPDF({
    type,
    templateTitle: labels[type] || 'Official Document',
    reviewDate: reviewDate || new Date().toLocaleDateString('en-IN'),
    teamName: team.name,
    programName: team.program?.name || 'Academic Programme',
    guideName: team.guideId?.name ?? 'N/A',
    coordinatorName: panel?.coordinatorId?.name ?? 'Dr. Ramesh Gurunath',
    students: formattedStudents,
    externalName: vivaPanel?.externalMembers?.[0]?.name ?? 'Dr. R. Ramanujam',
    externalAffiliation: vivaPanel?.externalMembers?.[0]?.affiliation ?? 'IIT Madras',
    externalEmail: vivaPanel?.externalMembers?.[0]?.email ?? 'ramanujam@iitm.ac.in',
    signatureBase64: signature?.imageBase64,
  });

  const filename = `${type}-${team.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(pdfBuffer);
});

/** GET /documents/preview/:type — generate and return as JSON for in-browser editing. */
export const previewLetter = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const { teamId, reviewDate } = req.query as { teamId: string; reviewDate?: string };
  if (!teamId) throw ApiError.badRequest('teamId is required');

  const team = await Team.findById(teamId).populate('guideId', 'name').lean() as any;
  if (!team) throw ApiError.notFound('Team not found');

  const panel = await ReviewPanel.findOne({ teamIds: teamId }).populate('coordinatorId', 'name').lean() as any;
  const vivaPanel = await VivaPanel.findOne({ teamIds: teamId }).lean() as any;

  const data: LetterData = {
    teamName: team.name,
    guideName: team.guideId?.name ?? 'N/A',
    coordinatorName: panel?.coordinatorId?.name ?? 'Coordinator',
    reviewDate: reviewDate ?? new Date().toLocaleDateString('en-IN'),
    externalName: vivaPanel?.externalMembers?.[0]?.name ?? '',
    externalAffiliation: vivaPanel?.externalMembers?.[0]?.affiliation ?? '',
    externalEmail: vivaPanel?.externalMembers?.[0]?.email ?? '',
  };

  // Return raw template text (for live editor)
  const template = getDefaultTemplate(type);
  let preview = template;
  for (const [key, value] of Object.entries(data)) {
    preview = preview.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value ?? ''));
  }

  res.json({ preview, data, templateName: type });
});
