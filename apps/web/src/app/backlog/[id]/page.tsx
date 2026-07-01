"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, BacklogItem, Comment } from "@/lib/api";
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
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ROLE_COLORS: Record<string, string> = {
  PM: "bg-blue-600", ADMIN: "bg-purple-600", ENGINEERING: "bg-green-700",
  CS: "bg-amber-600", SALES: "bg-rose-600", IMPLEMENTATION: "bg-cyan-700",
};
const CHURN_COLORS: Record<string, string> = {
  NONE: "bg-slate-600", LOW: "bg-green-700", MEDIUM: "bg-amber-600", HIGH: "bg-red-700",
};

function RoleBadge({ role, label }: { role: string; label?: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${ROLE_COLORS[role] ?? "bg-slate-600"}`}>
      {label ?? role}
    </span>
  );
}

function CommentItem({
  comment, currentUser, itemId, onRefresh,
}: {
  comment: Comment; currentUser: DemoUser; itemId: string; onRefresh: () => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReply() {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      await api.backlog.addComment(itemId, replyBody, comment.id);
      setReplyBody("");
      setReplyOpen(false);
      onRefresh();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  }

  async function deleteComment() {
    if (!confirm("Delete this comment?")) return;
    try { await api.backlog.deleteComment(itemId, comment.id); onRefresh(); } catch { /* ignore */ }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
          {(comment.authorName ?? "?").charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-200">{comment.authorName ?? "Unknown"}</span>
            <span className="text-xs text-slate-500">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{comment.body}</p>
          <div className="flex gap-3 mt-1">
            <button onClick={() => setReplyOpen((v) => !v)} className="text-xs text-slate-500 hover:text-blue-400 transition-colors">Reply</button>
            {comment.authorId === currentUser.id && (
              <button onClick={deleteComment} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Delete</button>
            )}
          </div>
          {replyOpen && (
            <div className="mt-2 space-y-2">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                placeholder="Write a reply..."
              />
              <div className="flex gap-2">
                <button onClick={submitReply} disabled={submitting} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md disabled:opacity-60 transition-colors">
                  {submitting ? "Posting..." : "Reply"}
                </button>
                <button onClick={() => setReplyOpen(false)} className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-md hover:bg-slate-600 transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l border-slate-700 pl-4">
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} currentUser={currentUser} itemId={itemId} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BacklogItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<BacklogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<DemoUser>(getCurrentUser());
  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    const handler = () => setUser(getCurrentUser());
    window.addEventListener("userChange", handler);
    return () => window.removeEventListener("userChange", handler);
  }, []);

  async function load() {
    try {
      const data = await api.backlog.get(id);
      setItem(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load item");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    try {
      await api.backlog.delete(id);
      router.push("/backlog");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete item");
    }
  }

  async function handlePublishToggle() {
    if (!item) return;
    setPublishLoading(true);
    try {
      const updated = await api.backlog.publish(id, !item.published);
      setItem(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update publish status");
    } finally {
      setPublishLoading(false);
    }
  }

  async function handleAddComment() {
    if (!commentBody.trim()) return;
    setCommentSubmitting(true);
    try {
      await api.backlog.addComment(id, commentBody);
      setCommentBody("");
      await load();
    } catch { /* ignore */ } finally { setCommentSubmitting(false); }
  }

  const canManage = user.role === "PM" || user.role === "ADMIN";

  if (loading) return <Spinner />;
  if (error) return <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>;
  if (!item) return null;

  const scoreColor =
    (item.priorityScore ?? 0) >= 80 ? "text-green-400" :
    (item.priorityScore ?? 0) >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <Link href="/backlog" className="text-slate-400 hover:text-white text-sm">← Back to Backlog</Link>
        <div className="flex items-start justify-between gap-4 mt-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-100">{item.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {item.status && <StatusBadge name={item.status.name} color={item.status.color} />}
              {item.product && <span className="text-sm text-slate-400">{item.product.name}</span>}
              {item.productArea && <><span className="text-slate-600">›</span><span className="text-sm text-slate-400">{item.productArea.name}</span></>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/backlog/${id}/edit`} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-md transition-colors">Edit</Link>
            {canManage && (
              <>
                <button
                  onClick={handlePublishToggle}
                  disabled={publishLoading}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-60 ${item.published ? "bg-green-800 hover:bg-green-700 text-green-200" : "bg-slate-700 hover:bg-slate-600 text-slate-200"}`}
                >
                  {item.published ? "Published" : "Publish"}
                </button>
                <button onClick={handleDelete} className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 text-sm rounded-md transition-colors">Delete</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {item.description && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Description</h2>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Customer Impact */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Customer Impact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">Customers Impacted</div>
                <div className="text-slate-200 font-medium mt-1">{item.customersImpacted?.toLocaleString() ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">ARR Represented</div>
                <div className="text-slate-200 font-medium mt-1">{item.arrRepresented ? `$${item.arrRepresented.toLocaleString()}` : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Churn Risk</div>
                <div className="mt-1">
                  {item.churnRisk ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${CHURN_COLORS[item.churnRisk] ?? "bg-slate-600"}`}>
                      {item.churnRisk}
                    </span>
                  ) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Segment</div>
                <div className="text-slate-200 font-medium mt-1">{item.customerSegment ?? "—"}</div>
              </div>
            </div>
            {item.supportingEvidence && (
              <div className="mt-4">
                <div className="text-xs text-slate-500">Supporting Evidence</div>
                <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{item.supportingEvidence}</p>
              </div>
            )}
          </div>

          {/* Business Impact */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Business Impact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">Revenue Opportunity</div>
                <div className="text-slate-200 font-medium mt-1">{item.revenueOpportunity ? `$${item.revenueOpportunity.toLocaleString()}` : "—"}</div>
              </div>
              <div className="flex gap-4">
                <div>
                  <div className="text-xs text-slate-500">Compliance</div>
                  <div className={`text-sm font-medium mt-1 ${item.isComplianceReq ? "text-amber-400" : "text-slate-500"}`}>
                    {item.isComplianceReq ? "Yes" : "No"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Competitive Gap</div>
                  <div className={`text-sm font-medium mt-1 ${item.isCompetitiveGap ? "text-orange-400" : "text-slate-500"}`}>
                    {item.isCompetitiveGap ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>
            {item.strategicNotes && (
              <div className="mt-4">
                <div className="text-xs text-slate-500">Strategic Notes</div>
                <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{item.strategicNotes}</p>
              </div>
            )}
          </div>

          {/* Engineering Assessment */}
          {item.engReviewedAt && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Engineering Assessment</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Effort</div>
                  <div className="text-slate-200 font-medium mt-1">{item.engEffort ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Complexity</div>
                  <div className="text-slate-200 font-medium mt-1">{item.engComplexity ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Confidence</div>
                  <div className="text-slate-200 font-medium mt-1">{item.engConfidence != null ? `${item.engConfidence}%` : "—"}</div>
                </div>
              </div>
              {item.engTechnicalDeps && (
                <div className="mt-4">
                  <div className="text-xs text-slate-500">Technical Dependencies</div>
                  <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{item.engTechnicalDeps}</p>
                </div>
              )}
              {item.engRisks && (
                <div className="mt-3">
                  <div className="text-xs text-slate-500">Risks</div>
                  <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{item.engRisks}</p>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Comments {item._count?.comments ? `(${item._count.comments})` : ""}
            </h2>
            {item.comments && item.comments.length > 0 ? (
              <div className="space-y-4 divide-y divide-slate-700/50">
                {item.comments.map((c) => (
                  <div key={c.id} className="pt-4 first:pt-0">
                    <CommentItem comment={c} currentUser={user} itemId={id} onRefresh={load} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No comments yet.</p>
            )}
            <div className="border-t border-slate-700 pt-4 space-y-2">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={3}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={commentSubmitting || !commentBody.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md disabled:opacity-60 transition-colors"
              >
                {commentSubmitting ? "Posting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Priority score */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Priority Score</div>
            <div className={`text-5xl font-bold ${scoreColor}`}>{item.priorityScore ?? "—"}</div>
          </div>

          {/* Key fields */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
            {[
              { label: "Owner", value: item.owner ?? "—" },
              { label: "Source", value: item.source?.name ?? "—" },
              { label: "Quarter", value: item.roadmapQuarter ?? "—" },
              { label: "Release", value: item.targetRelease?.name ?? "—" },
              ...(item.jiraKey ? [{ label: "Jira Key", value: item.jiraKey }] : []),
            ].map((f) => (
              <div key={f.label}>
                <div className="text-xs text-slate-500">{f.label}</div>
                <div className="text-sm text-slate-200 mt-0.5">{f.value}</div>
              </div>
            ))}
          </div>

          {/* Upvotes */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Upvotes</span>
            <span className="text-slate-200 font-medium">👍 {item._count?.upvotes ?? 0}</span>
          </div>

          {/* Initiatives */}
          {item.initiatives && item.initiatives.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Initiatives</div>
              <div className="flex flex-wrap gap-2">
                {item.initiatives.map((ini) => (
                  <span key={ini.id} className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: ini.color ?? "#475569" }}>
                    {ini.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
