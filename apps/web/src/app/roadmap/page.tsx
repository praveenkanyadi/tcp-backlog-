"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, BacklogItem, RoadmapQuarter } from "@/lib/api";
import { getCurrentUser, DemoUser } from "@/lib/auth";
import { Spinner } from "@/components/spinner";
import { StatusBadge } from "@/components/status-badge";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ItemCard({ item, currentUser, onUpdate }: { item: BacklogItem; currentUser: DemoUser; onUpdate: () => void }) {
  const [upvoted, setUpvoted] = useState(item.userUpvoted ?? false);
  const [upvoteCount, setUpvoteCount] = useState(item._count?.upvotes ?? 0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackBody, setFeedbackBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  async function handleUpvote() {
    try {
      const res = await api.backlog.toggleUpvote(item.id);
      setUpvoted(res.upvoted);
      setUpvoteCount(res.count);
    } catch { /* ignore */ }
  }

  async function handleFeedback() {
    if (!feedbackBody.trim()) return;
    setSubmitting(true);
    try {
      await api.backlog.addComment(item.id, feedbackBody);
      setFeedbackBody("");
      setFeedbackOpen(false);
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 3000);
      onUpdate();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  }

  const productColor = item.product?.id
    ? `#${parseInt(item.product.id.replace(/\D/g, "").slice(0, 6) || "475569", 16).toString(16).padStart(6, "0")}`
    : "#475569";

  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 p-4 space-y-3 hover:border-slate-600 transition-colors">
      {/* Product badge */}
      {item.product && (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="text-xs text-slate-400">{item.product.name}</span>
        </div>
      )}

      {/* Title */}
      <Link
        href={`/backlog/${item.id}`}
        className="block text-sm font-semibold text-slate-100 hover:text-blue-400 transition-colors leading-snug"
      >
        {item.title}
      </Link>

      {/* Status */}
      {item.status && (
        <StatusBadge name={item.status.name} color={item.status.color} />
      )}

      {/* Description preview */}
      {item.description && (
        <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
      )}

      {/* Counts + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-500">💬 {item._count?.comments ?? 0}</span>
        <button
          onClick={handleUpvote}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
            upvoted
              ? "bg-blue-600 border-blue-500 text-white"
              : "border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400"
          }`}
        >
          👍 {upvoted ? "Voted" : "Vote"} ({upvoteCount})
        </button>
        <button
          onClick={() => setFeedbackOpen((v) => !v)}
          className="text-xs text-slate-500 hover:text-blue-400 transition-colors"
        >
          Add feedback
        </button>
      </div>

      {feedbackSuccess && (
        <div className="text-xs text-green-400">Feedback submitted — thank you!</div>
      )}

      {feedbackOpen && (
        <div className="space-y-2 pt-1 border-t border-slate-700">
          <textarea
            value={feedbackBody}
            onChange={(e) => setFeedbackBody(e.target.value)}
            rows={2}
            placeholder="Share your thoughts..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleFeedback}
              disabled={submitting || !feedbackBody.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md disabled:opacity-60 transition-colors"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button onClick={() => setFeedbackOpen(false)} className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-md hover:bg-slate-600 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoadmapPage() {
  const [quarters, setQuarters] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapQuarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("All");
  const [user] = useState<DemoUser>(getCurrentUser());

  async function load() {
    try {
      const [qs, data] = await Promise.all([api.roadmap.quarters(), api.roadmap.get()]);
      setQuarters(qs);
      setRoadmap(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = selectedQuarter === "All"
    ? roadmap
    : roadmap.filter((q) => q.quarter === selectedQuarter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-700 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-blue-400 font-bold text-sm">TCP</span>
          <span className="text-slate-600">|</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-100">Product Roadmap</h1>
        <p className="text-slate-400 mt-1">Published initiatives for stakeholder review</p>
      </div>

      {/* Quarter filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {["All", ...quarters].map((q) => (
          <button
            key={q}
            onClick={() => setSelectedQuarter(q)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedQuarter === q
                ? "bg-blue-600 text-white"
                : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center text-slate-400">
          No published items found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((quarter) => (
            <div key={quarter.quarter} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{quarter.quarter}</h2>
                <span className="text-xs text-slate-600">{quarter.items.length}</span>
              </div>
              {quarter.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-xs text-slate-600">
                  No items planned for this quarter yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {quarter.items.map((item) => (
                    <ItemCard key={item.id} item={item} currentUser={user} onUpdate={load} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
