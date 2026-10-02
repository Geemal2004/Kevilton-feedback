import { CATEGORIES, MODULES, STATUSES } from "@/lib/constants";

export type FilterState = {
  category: string;
  module: string;
  status: string;
  search: string;
};

export const EMPTY_FILTERS: FilterState = {
  category: "",
  module: "",
  status: "",
  search: "",
};

export default function Filters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const selectClass =
    "min-h-[44px] rounded-xl border border-zinc-400/50 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-zinc-600 bg-background";

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1 text-xs font-medium opacity-90">
        Type
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className={selectClass}
        >
          <option value="">All types</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium opacity-90">
        Area
        <select
          value={filters.module}
          onChange={(e) => onChange({ ...filters, module: e.target.value })}
          className={selectClass}
        >
          <option value="">All areas</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium opacity-90">
        Status
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium opacity-90">
        Search name or comment
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="e.g. pairing…"
          className="min-h-[44px] rounded-xl border border-zinc-400/50 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground dark:border-zinc-600"
        />
      </label>
    </div>
  );
}
