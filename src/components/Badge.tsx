const CATEGORY_STYLES: Record<string, string> = {
  comment: "bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-sky-500/40",
  pain_point: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/40",
  bug: "bg-red-500/15 text-red-600 dark:text-red-300 ring-red-500/40",
  improvement: "bg-violet-500/15 text-violet-600 dark:text-violet-300 ring-violet-500/40",
};

const CATEGORY_LABELS: Record<string, string> = {
  comment: "Comment",
  pain_point: "Pain point",
  bug: "Bug",
  improvement: "Improvement",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-600 dark:text-blue-300 ring-blue-500/40",
  reviewed: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 ring-yellow-500/40",
  resolved: "bg-green-500/15 text-green-700 dark:text-green-300 ring-green-500/40",
};

function base(extra: string) {
  return `inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${extra}`;
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={base(CATEGORY_STYLES[category] ?? "bg-zinc-500/15 ring-zinc-500/40")}>
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={base(STATUS_STYLES[status] ?? "bg-zinc-500/15 ring-zinc-500/40")}>
      {status}
    </span>
  );
}
