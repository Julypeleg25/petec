const PDF_HEADER = "%PDF-1.4\n";
const PDF_NEWLINE = "\n";

const escapePdfText = (value: string): string =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const buildContentStream = (lines: readonly string[]): string => {
  const instructions: string[] = ["BT", "/F1 10 Tf", "50 780 Td"];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      instructions.push("0 -14 Td");
    }
    instructions.push(`(${escapePdfText(lines[i])}) Tj`);
  }
  instructions.push("ET");
  return instructions.join(PDF_NEWLINE);
};

const toPdfObjects = (contentStream: string): readonly string[] => [
  "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
  "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
  "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
  `4 0 obj << /Length ${Buffer.byteLength(contentStream, "utf-8")} >> stream\n${contentStream}\nendstream endobj`,
  "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
];

const buildXref = (offsets: readonly number[]): string => {
  const lines: string[] = [`xref`, `0 ${offsets.length}`, "0000000000 65535 f "];
  for (let i = 1; i < offsets.length; i++) {
    lines.push(`${String(offsets[i]).padStart(10, "0")} 00000 n `);
  }
  return lines.join(PDF_NEWLINE);
};

export const createSimplePdfBuffer = (title: string, payload: string): Buffer => {
  const payloadLines = payload.split(/\r?\n/);
  const contentLines = [title, "", ...payloadLines];
  const contentStream = buildContentStream(contentLines);
  const objects = toPdfObjects(contentStream);

  let body = PDF_HEADER;
  const offsets: number[] = [0];

  for (const objectContent of objects) {
    offsets.push(Buffer.byteLength(body, "utf-8"));
    body += `${objectContent}${PDF_NEWLINE}`;
  }

  const xrefStart = Buffer.byteLength(body, "utf-8");
  body += `${buildXref(offsets)}${PDF_NEWLINE}`;
  body += `trailer << /Size ${offsets.length} /Root 1 0 R >>${PDF_NEWLINE}`;
  body += `startxref${PDF_NEWLINE}${xrefStart}${PDF_NEWLINE}%%EOF`;

  return Buffer.from(body, "utf-8");
};
