// CSV helpers: proper escaping incl. formula-injection mitigation.

export type FeedbackCsvInput = {
  id: number;
  createdAt: Date;
  testerName: string;
  category: string;
  module: string;
  message: string;
  status: string;
};

/**
 * Escape one CSV cell:
 * - prefix cells starting with = + - @ (or tab/newline tricks) with a single
 *   quote to prevent spreadsheet formula injection
 * - wrap in double quotes when the cell contains , " \n \r, doubling quotes
 */
export function escapeCsvCell(
  value: string | number | Date | null | undefined,
): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const CSV_HEADER = [
  "id",
  "createdAt",
  "testerName",
  "category",
  "module",
  "message",
  "status",
];

export function buildFeedbackCsv(rows: FeedbackCsvInput[]): string {
  const lines = [CSV_HEADER.join(",")];
  for (const row of rows) {
    lines.push(
      [
        escapeCsvCell(row.id),
        escapeCsvCell(row.createdAt),
        escapeCsvCell(row.testerName),
        escapeCsvCell(row.category),
        escapeCsvCell(row.module),
        escapeCsvCell(row.message),
        escapeCsvCell(row.status),
      ].join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}

/** UTF-8 BOM so Excel opens the file with correct encoding. */
export const CSV_BOM = "﻿";
