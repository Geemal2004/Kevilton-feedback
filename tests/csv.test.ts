import { describe, expect, it } from "vitest";
import { buildFeedbackCsv, escapeCsvCell } from "@/lib/csv";

describe("escapeCsvCell", () => {
  it("leaves plain text untouched", () => {
    expect(escapeCsvCell("hello world")).toBe("hello world");
  });

  it("quotes cells containing commas, quotes or line breaks", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsvCell("a\rb")).toBe('"a\rb"');
  });

  it("neutralises formula injection (= + - @ and tab)", () => {
    expect(escapeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvCell("+cmd")).toBe("'+cmd");
    expect(escapeCsvCell("-cmd")).toBe("'-cmd");
    expect(escapeCsvCell("@cmd")).toBe("'@cmd");
    // Combined with quoting when needed:
    expect(escapeCsvCell("=a,b")).toBe("\"'=a,b\"");
  });

  it("handles numbers, dates, null and undefined", () => {
    expect(escapeCsvCell(42)).toBe("42");
    expect(escapeCsvCell(new Date("2026-01-02T03:04:05.000Z"))).toBe(
      "2026-01-02T03:04:05.000Z",
    );
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });
});

describe("buildFeedbackCsv", () => {
  it("renders header plus one line per row with CRLF endings", () => {
    const csv = buildFeedbackCsv([
      {
        id: 1,
        createdAt: new Date("2026-01-02T03:04:05.000Z"),
        testerName: "Alex",
        category: "bug",
        module: "Device Pairing",
        message: "It broke, =really, badly",
        status: "new",
      },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "id,createdAt,testerName,category,module,message,status",
    );
    expect(lines[1]).toContain("Alex");
    expect(lines[1]).toContain('"It broke, =really, badly"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });
});
