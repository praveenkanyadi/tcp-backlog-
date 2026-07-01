"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, BacklogItem, BacklogTaxonomy } from "@/lib/api";
import { Spinner } from "@/components/spinner";
import { StatusBadge } from "@/components/status-badge";

export default function BacklogPage() {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxonomy, setTaxonomy] = useState<BacklogTaxonomy | null>(null);

  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [publishedOnly, setPublishedOnly] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    api.backlog.taxonomy().then(setTaxonomy).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.backlog.list({
        search: debouncedSearch || undefined,
        productId: productId || undefined,
        statusId: statusId || undefined,
        published: publishedOnly ? true : undefined,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, productId, statusId, publishedOnly]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const published = items.filter((i) => i.published).length;
  const avgScore =
    items.length > 0
      ? Math.round(items.reduce((s, i) => s + (i.priorityScore ?? 0), 0) / items.length)
      : 0;
  const totalUpvotes = items.reduce((s, i) => s + (i._count?.upvotes ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Product Backlog</h1>
        <Link
          href="/backlog/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Item
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: total },
          { label: "Published", value: published },
          { label: "Avg Score", value: avgScore },
          { label: "Total Upvotes", value: totalUpvotes },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-slate-100">{kpi.value}</div>
            <div className="text-sm text-slate-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-slate-800 border border-slate-700 rounded-lg p-4">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-40 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Products</option>
          {taxonomy?.products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={statusId}
          onChange={(e) => setStatusId(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {taxonomy?.statuses.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={publishedOnly}
            onChange={(e) => setPublishedOnly(e.target.checked)}
            className="w-4 h-4 accent-blue-500"
          />
          Published only
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center text-slate-400">
          No backlog items found. Create your first item.
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {["Rank", "Title", "Product", "Status", "Upvotes", "Quarter", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {item.priorityRank ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/backlog/${item.id}`}
                        className="text-slate-200 hover:text-blue-400 font-medium transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      {item.jiraKey && (
                        <span className="text-xs text-slate-500 ml-2">{item.jiraKey}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {item.product?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {item.status && (
                        <StatusBadge name={item.status.name} color={item.status.color} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      👍 {item._count?.upvotes ?? 0}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {item.roadmapQuarter ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/backlog/${item.id}/edit`}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
