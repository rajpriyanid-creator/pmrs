import ExcelJS from 'exceljs';
import { ApiError } from '../utils/ApiError';

export interface ColumnDef {
  header: string;
  key: string;
  width?: number;
  required?: boolean;
}

/** Builds a workbook buffer for any tabular export (faculty, attendance, marks, assignments). */
export async function buildWorkbook(sheetName: string, columns: ColumnDef[], rows: Record<string, unknown>[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PRMS';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 20 }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: 'middle' };
  rows.forEach((row) => sheet.addRow(row));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Parses an uploaded workbook against an expected column template.
 * Fails the whole import (rather than best-effort partial parse) if the
 * header row doesn't match, per the spec's "reject rather than best-effort
 * parse" rule (Section 10).
 */
export async function parseWorkbook(
  buffer: Buffer,
  expectedColumns: ColumnDef[]
): Promise<Record<string, string | number>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw ApiError.badRequest('Uploaded file has no worksheet');

  const headerRow = sheet.getRow(1).values as unknown[];
  // ExcelJS row.values is 1-indexed with index 0 undefined.
  const headers = headerRow.slice(1).map((h) => String(h ?? '').trim());
  const expectedHeaders = expectedColumns.map((c) => c.header);

  const headersMatch =
    headers.length >= expectedHeaders.length &&
    expectedHeaders.every((h, i) => headers[i]?.toLowerCase() === h.toLowerCase());

  if (!headersMatch) {
    throw ApiError.badRequest('Uploaded file does not match the required template', {
      expected: expectedHeaders,
      received: headers,
    });
  }

  const rows: Record<string, string | number>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values as unknown[];
    const record: Record<string, string | number> = {};
    let isEmpty = true;
    expectedColumns.forEach((col, i) => {
      const raw = values[i + 1];
      if (raw !== undefined && raw !== null && raw !== '') isEmpty = false;
      record[col.key] = typeof raw === 'object' && raw !== null && 'text' in (raw as any) ? (raw as any).text : (raw as string | number) ?? '';
    });
    if (!isEmpty) rows.push(record);
  });

  // Strict schema check before any DB write: required columns must be present on every row.
  const missingRequired = expectedColumns.filter((c) => c.required);
  rows.forEach((row, idx) => {
    for (const col of missingRequired) {
      if (row[col.key] === '' || row[col.key] === undefined) {
        throw ApiError.badRequest(`Row ${idx + 2} is missing required column "${col.header}"`);
      }
    }
  });

  return rows;
}
