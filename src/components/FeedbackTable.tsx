"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CategoryBadge } from "@/components/Badge";
import Filters, { EMPTY_FILTERS, type FilterState } from "@/components/Filters";

type FeedbackRow = {
  id: number;
  createdAt: string;
  testerName: string;
  category: string;
  module: string;
  message: string;
  status: string;
};

type Counts = { total: number; new: number; reviewed: number; resolved: number };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function FeedbackTable() {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, new: 0, reviewed: 0, resolved: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search box so we don't fetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  function updateFilters(next: FilterState) {
    setFilters(next);
    if (next.category !== filters.category || next.module !== filters.module || next.status !== filters.status) {
      setPage(1);
    }
  }

  const queryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.module) params.set("module", filters.module);
    if (filters.status) params.set("status", filters.status);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    return params.toString();
  }, [filters.category, filters.module, filters.status, debouncedSearch, page]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/feedback?${queryString()}`);
        if (res.status === 401) {
          router.refresh();
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load feedback");
        if (!cancelled) {
          setRows(data.data);
          setCounts(data.counts);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load feedback");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [queryString, router]);

  async function changeStatus(id: number, status: string) {
    const previous = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      if (!res.ok) throw new Error("Save failed");
      // Refresh header counts after a status change.
      const data = (await res.json().catch(() => null)) as null;
      void data;
    } catch {
      setRows(previous);
      setError("Could not save status. Please retry.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm opacity-80" aria-live="polite">
          {counts.total} total, {counts.new} new
          {total !== counts.total && ` · ${total} match filters`}
        </p>
        <div className="flex gap-2">
          <a
            href={`/api/admin/export?${queryString()}`}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-zinc-400/50 px-4 text-sm font-medium transition-colors hover:border-foreground dark:border-zinc-600"
          >
            Download CSV
          </a>
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-zinc-400/50 px-4 text-sm font-medium transition-colors hover:border-foreground dark:border-zinc-600"
          >
            Logout
          </button>
        </div>
      </div>

      <Filters filters={filters} onChange={updateFilters} />

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm opacity-70">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-zinc-400/30 py-10 text-center text-sm opacity-70 dark:border-zinc-700">
          No feedback matches these filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-400/30 dark:border-zinc-700">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-400/30 bg-zinc-500/5 dark:border-zinc-700">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Area</th>
                <th className="px-3 py-2 font-medium">Comment</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-400/20 align-top last:border-0 dark:border-zinc-800"
                >
                  <td className="whitespace-nowrap px-3 py-2 text-xs opacity-80">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium">
                    {row.testerName}
                  </td>
                  <td className="px-3 py-2">
                    <CategoryBadge category={row.category} />
                  </td>
                  <td className="max-w-[180px] px-3 py-2 text-xs">{row.module}</td>
                  <td className="max-w-[340px] whitespace-pre-wrap break-words px-3 py-2">
                    {row.message}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Status for feedback ${row.id}`}
                      value={row.status}
                      onChange={(e) => changeStatus(row.id, e.target.value)}
                      className="min-h-[40px] rounded-lg border border-zinc-400/50 bg-transparent px-2 text-xs outline-none focus:border-foreground dark:border-zinc-600 bg-background"
                    >
                      <option value="new">new</option>
                      <option value="reviewed">reviewed</option>
                      <option value="resolved">resolved</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="min-h-[44px] rounded-xl border border-zinc-400/50 px-4 disabled:opacity-40 dark:border-zinc-600"
        >
          ← Prev
        </button>
        <span className="opacity-70" aria-live="polite">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
          className="min-h-[44px] rounded-xl border border-zinc-400/50 px-4 disabled:opacity-40 dark:border-zinc-600"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
