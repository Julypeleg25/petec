import { createSimplePdfBuffer } from "../../src/utils/pdf.utils.js";

describe("pdf.utils", () => {
  it("creates a minimal pdf buffer with escaped text content", () => {
    const pdf = createSimplePdfBuffer(
      "Case Summary (A)",
      "Line one\nBackslash \\\nBrackets ()",
    );
    const content = pdf.toString("utf-8");

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(content.startsWith("%PDF-1.4\n")).toBe(true);
    expect(content).toContain("(Case Summary \\(A\\)) Tj");
    expect(content).toContain("(Backslash \\\\) Tj");
    expect(content).toContain("(Brackets \\(\\)) Tj");
    expect(content).toContain("xref");
    expect(content).toContain("startxref");
    expect(content.endsWith("%%EOF")).toBe(true);
  });
});