"use client";

import { useEffect, useState } from "react";
import {
  CATEGORIES,
  MESSAGE_MAX,
  MODULES,
  NAME_MAX,
} from "@/lib/constants";

type FormState = {
  testerName: string;
  category: string;
  module: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const CATEGORY_VALUES: readonly string[] = CATEGORIES.map((c) => c.value);
const DEFAULTS: FormState = {
  testerName: "",
  category: "comment",
  module: MODULES[0],
  message: "",
};

const NAME_KEY = "kevilton-tester-name";

function validate(state: FormState): FieldErrors {
  const errors: FieldErrors = {};
  const name = state.testerName.trim();
  if (name.length < 2) errors.testerName = "Please enter your name (min 2 characters).";
  else if (name.length > NAME_MAX) errors.testerName = `Name must be at most ${NAME_MAX} characters.`;

  if (!CATEGORY_VALUES.includes(state.category)) errors.category = "Please choose a feedback type.";

  if (!(MODULES as readonly string[]).includes(state.module)) errors.module = "Please choose an area of the app.";

  const message = state.message.trim();
  if (message.length < 5) errors.message = "Please write a little more (min 5 characters).";
  else if (message.length > MESSAGE_MAX) errors.message = `Comment must be at most ${MESSAGE_MAX} characters.`;
  return errors;
}

export default function FeedbackForm() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [thankYouName, setThankYouName] = useState<string | null>(null);

  // Remember the tester's name for the next comment.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) setForm((f) => ({ ...f, testerName: saved }));
    } catch {
      // localStorage unavailable (private mode) — ignore.
    }
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate(form);
    setErrors(validation);
    setServerError(null);
    if (Object.values(validation).some(Boolean)) return;

    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website: "" }),
      });
      const data = (await res.json().catch(() => null)) as {
        fieldErrors?: FieldErrors;
        error?: string;
      } | null;

      if (!res.ok) {
        if (data?.fieldErrors) setErrors(data.fieldErrors);
        setServerError(
          data?.error ?? "Could not send feedback. Please try again.",
        );
        return;
      }

      try {
        localStorage.setItem(NAME_KEY, form.testerName.trim());
      } catch {
        // ignore
      }
      setThankYouName(form.testerName.trim());
    } catch {
      setServerError("Network error. Please check your connection and retry.");
    } finally {
      setSending(false);
    }
  }

  function sendAnother() {
    setThankYouName(null);
    setForm((f) => ({ ...f, category: "comment", module: MODULES[0], message: "" }));
    setErrors({});
    setServerError(null);
  }

  if (thankYouName) {
    return (
      <div className="rounded-2xl border border-green-600/30 bg-green-500/10 p-8 text-center">
        <p className="text-2xl font-semibold">Thank you, {thankYouName}!</p>
        <p className="mt-2 opacity-80">
          Your feedback has been sent to the Kevilton team.
        </p>
        <button
          type="button"
          onClick={sendAnother}
          className="mt-6 min-h-[48px] rounded-xl bg-foreground px-6 text-background transition-opacity hover:opacity-90"
        >
          Send another
        </button>
      </div>
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-transparent px-4 py-3 text-base outline-none transition-colors focus:border-foreground ${
      hasError ? "border-red-500" : "border-zinc-400/50 dark:border-zinc-600"
    }`;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="testerName" className="mb-1 block text-sm font-medium">
          Your name
        </label>
        <input
          id="testerName"
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX}
          value={form.testerName}
          onChange={(e) => set("testerName", e.target.value)}
          className={`${inputClass(Boolean(errors.testerName))} min-h-[48px]`}
          placeholder="e.g. Alex"
        />
        {errors.testerName && (
          <p className="mt-1 text-sm text-red-500">{errors.testerName}</p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Type</legend>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <label
              key={c.value}
              className={`flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                form.category === c.value
                  ? "border-foreground bg-foreground/10"
                  : "border-zinc-400/50 dark:border-zinc-600"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c.value}
                checked={form.category === c.value}
                onChange={() => set("category", c.value)}
                className="h-5 w-5 accent-current"
              />
              {c.label}
            </label>
          ))}
        </div>
        {errors.category && (
          <p className="mt-1 text-sm text-red-500">{errors.category}</p>
        )}
      </fieldset>

      <div>
        <label htmlFor="module" className="mb-1 block text-sm font-medium">
          Area of the app
        </label>
        <select
          id="module"
          value={form.module}
          onChange={(e) => set("module", e.target.value)}
          className={`${inputClass(Boolean(errors.module))} min-h-[48px] bg-background`}
        >
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {errors.module && (
          <p className="mt-1 text-sm text-red-500">{errors.module}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium">
          Your comment
        </label>
        <textarea
          id="message"
          rows={5}
          maxLength={MESSAGE_MAX}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          className={`${inputClass(Boolean(errors.message))} resize-y`}
          placeholder="What worked, what was hard, what should we improve?"
        />
        <div className="mt-1 flex justify-between text-xs opacity-70">
          <span>{errors.message ?? ""}</span>
          <span aria-live="polite">
            {form.message.length} / {MESSAGE_MAX}
          </span>
        </div>
        {errors.message && (
          <p className="-mt-0.5 text-sm text-red-500">{errors.message}</p>
        )}
      </div>

      {/* Honeypot field: hidden from humans, bots may fill it. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        defaultValue=""
      />

      {serverError && (
        <p role="alert" className="text-sm text-red-500">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="min-h-[52px] rounded-xl bg-foreground px-6 text-lg font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
