"use client";

import { useEffect, useState } from "react";
import { api, BacklogItem, BacklogProduct } from "@/lib/api";
import { getCurrentUser, DemoUser } from "@/lib/auth";
import { Spinner } from "@/components/spinner";
import { StatusBadge } from "@/components/status-badge";

export default function RankPage() {
  const [user, setUser] = useState<DemoUser>(getCurrentUser());
  const [products, setProducts] = useState<BacklogProduct[]>([]);
  const [productId, setProductId] = useState("");
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => setUser(getCurrentUser());
    window.addEventListener("userChange", handler);
    return () => window.removeEventListener("userChange", handler);
  }, []);

  useEffect(() => {
    api.backlog.taxonomy().then((t) => setProducts(t.products)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!productId) { setItems([]); return; }
    setLoading(true);
    api.backlog.list({ productId, limit: 200 }).then((r) => {
      setItems(r.items.sort((a, b) => (a.priorityRank ?? 9999) - (b.priorityRank ?? 9999)));
    }).catch((e) => setError(e instanceof Error ? e.message : "Failed to load")).finally(() => setLoading(false));
  }, [productId]);

  function onDragStart(i: number) { setDragIndex(i); }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    setItems(next);
    setDragIndex(i);
  }
  function onDrop() { setDragIndex(null); }

  async function handlePublishRanking() {
    if (!productId) return;
    setSaving(true);
    setError(null);
    try {
      await api.backlog.publishRanking(productId, items.map((item, i) => ({ id: item.id, priorityRank: i + 1 })));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish ranking");
    } finally {
      setSaving(false);
    }
  }

  const canAccess = user.role === "PM" || user.role === "ADMIN";

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center space-y-2">
          <div className="text-2xl text-slate-500">🔒</div>
          <h2 className="text-lg font-semibold text-slate-300">Access Restricted</h2>
          <p className="text-slate-500 text-sm">Stack ranking is only available to Product Managers and Admins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Stack Ranking</h1>
        <p className="text-slate-400 text-sm mt-1">Drag items to set their priority order, then publish the ranking.</p>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">Ranking published successfully!</div>}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Product</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">Select a product</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 && productId ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
          No items found for this product.
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={onDrop}
                className={`flex items-center gap-3 bg-slate-800 border rounded-lg px-4 py-3 cursor-grab active:cursor-grabbing transition-colors ${
                  dragIndex === i ? "border-blue-500 bg-slate-700" : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <span className="text-slate-500 text-lg select-none shrink-0">⠿</span>
                <span className="text-slate-500 font-mono text-sm w-6 shrink-0">{i + 1}</span>
                <span className="flex-1 text-slate-200 text-sm font-medium min-w-0 truncate">{item.title}</span>
                {item.status && <StatusBadge name={item.status.name} color={item.status.color} />}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePublishRanking}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
            >
              {saving ? "Publishing..." : "Publish Ranking"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
