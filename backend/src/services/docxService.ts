import fs from "node:fs/promises";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import mammoth from "mammoth";
// html-to-docx has no bundled types; treated as an untyped module boundary.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const htmlToDocx = require("html-to-docx");
import { ApiError } from "../utils/ApiError";

/**
 * Document & Letter Generation System (Section 6.13). Every step here works
 * on server-side files only - templates and generated letters are treated as
 * sensitive artifacts (Section 10): callers are responsible for storing
 * output behind access-controlled, non-guessable paths, never a public URL.
 */

const PLACEHOLDER_RE = /\{([a-zA-Z0-9_]+)\}/g;

/** Auto-detects {placeholder} fields in a .docx template without a hand-authored field map (6.13). */
export function detectPlaceholders(docxBuffer: Buffer): string[] {
  const zip = new PizZip(docxBuffer);
  const xml = zip.file("word/document.xml")?.asText() ?? "";
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_RE.exec(xml)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found);
}

/** Fills a .docx template with `data`, returning the generated document buffer. */
export function fillDocxTemplate(templateBuffer: Buffer, data: Record<string, unknown>): Buffer {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter: () => "" });
    doc.render(data);
    return doc.getZip().generate({ type: "nodebuffer" }) as Buffer;
  } catch (err) {
    throw ApiError.badRequest("Failed to render document template - check placeholder data", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Step 1 of the live-edit workflow: DOCX -> HTML for the CKEditor 5 surface. */
export async function docxToHtml(docxBuffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer: docxBuffer });
  return result.value;
}

/** Step 2 of the live-edit workflow: edited HTML -> DOCX for re-issuance. */
export async function htmlToDocxBuffer(html: string): Promise<Buffer> {
  const buf = await htmlToDocx(html, undefined, { table: { row: { cantSplit: true } } });
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
}

export async function readTemplateFile(path: string): Promise<Buffer> {
  return fs.readFile(path);
}
