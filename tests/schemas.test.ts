import { describe, expect, it } from "vitest";
import { MODULES } from "@/lib/constants";
import {
  adminFeedbackQuerySchema,
  feedbackInputSchema,
  statusUpdateSchema,
} from "@/lib/schemas";

const validFeedback = {
  testerName: "Alex",
  category: "bug",
  module: MODULES[2],
  message: "The pairing screen froze on step 2.",
  website: "",
};

describe("feedbackInputSchema", () => {
  it("accepts valid input", () => {
    const parsed = feedbackInputSchema.safeParse(validFeedback);
    expect(parsed.success).toBe(true);
  });

  it("trims whitespace before checking length", () => {
    const parsed = feedbackInputSchema.safeParse({
      ...validFeedback,
      testerName: "  Alex  ",
      message: "  hello world  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.testerName).toBe("Alex");
    }
  });

  it("rejects a too-short name", () => {
    const parsed = feedbackInputSchema.safeParse({
      ...validFeedback,
      testerName: "A",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an unknown category", () => {
    const parsed = feedbackInputSchema.safeParse({
      ...validFeedback,
      category: "praise",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a module outside the fixed list", () => {
    const parsed = feedbackInputSchema.safeParse({
      ...validFeedback,
      module: "Rocket Science",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts every module in the list", () => {
    for (const moduleName of MODULES) {
      const parsed = feedbackInputSchema.safeParse({
        ...validFeedback,
        module: moduleName,
      });
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects a too-short message and a too-long message", () => {
    expect(
      feedbackInputSchema.safeParse({ ...validFeedback, message: "hi" }).success,
    ).toBe(false);
    expect(
      feedbackInputSchema.safeParse({
        ...validFeedback,
        message: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });
});

describe("statusUpdateSchema", () => {
  it("accepts only new/reviewed/resolved", () => {
    expect(statusUpdateSchema.safeParse({ status: "reviewed" }).success).toBe(true);
    expect(statusUpdateSchema.safeParse({ status: "deleted" }).success).toBe(false);
    expect(statusUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("ignores extra fields (routes only use status)", () => {
    const parsed = statusUpdateSchema.safeParse({
      status: "resolved",
      message: "hacked",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("adminFeedbackQuerySchema", () => {
  it("defaults page to 1 and treats empty strings as absent", () => {
    const parsed = adminFeedbackQuerySchema.safeParse({
      category: "",
      search: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.category).toBeUndefined();
      expect(parsed.data.search).toBeUndefined();
    }
  });

  it("rejects unknown category/status values", () => {
    expect(
      adminFeedbackQuerySchema.safeParse({ category: "nope" }).success,
    ).toBe(false);
    expect(adminFeedbackQuerySchema.safeParse({ status: "nope" }).success).toBe(
      false,
    );
  });
});
