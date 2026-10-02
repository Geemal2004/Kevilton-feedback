import { z } from "zod";
import {
  MESSAGE_MAX,
  MESSAGE_MIN,
  MODULES,
  NAME_MAX,
  NAME_MIN,
} from "./constants";

export const categorySchema = z.enum([
  "comment",
  "pain_point",
  "bug",
  "improvement",
]);

export const statusSchema = z.enum(["new", "reviewed", "resolved"]);

// Public feedback submission. `website` is a honeypot field: the real form
// never fills it (hidden input), bots often do. A non-empty value is treated
// as spam and rejected silently with a fake success.
export const feedbackInputSchema = z.object({
  testerName: z
    .string()
    .trim()
    .min(NAME_MIN, `Name must be at least ${NAME_MIN} characters`)
    .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`),
  category: categorySchema,
  module: z.enum(MODULES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Please choose an area of the app" }),
  }),
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN, `Comment must be at least ${MESSAGE_MIN} characters`)
    .max(MESSAGE_MAX, `Comment must be at most ${MESSAGE_MAX} characters`),
  website: z.string().max(200).optional().default(""),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required").max(500),
});

const emptyToUndefined = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v.trim() === "" ? undefined : v));

// Query params for GET /api/admin/feedback and GET /api/admin/export
export const adminFeedbackQuerySchema = z.object({
  category: emptyToUndefined
    .pipe(categorySchema.optional())
    .optional()
    .transform((v) => v ?? undefined),
  module: emptyToUndefined.optional(),
  status: emptyToUndefined
    .pipe(statusSchema.optional())
    .optional()
    .transform((v) => v ?? undefined),
  search: emptyToUndefined
    .pipe(z.string().trim().max(200).optional())
    .optional()
    .transform((v) => v ?? undefined),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export const statusUpdateSchema = z.object({
  status: statusSchema,
});
