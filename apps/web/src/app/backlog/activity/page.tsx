"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, BacklogActivity } from "@/lib/api";
import { Spinner } from "@/components/spinner";

const CHANGE_COLORS: Record<string, string> = {
  CREATE: "bg-green-800 text-green-200",
  UPDATE: "bg-blue-800 text-blue-200",
  DELETE: "bg-red-800 text-red-200",
  PUBLISH: "bg-purple-800 text-purple-200",
  COMMENT: "bg-slate-600 text-slate-200",
  UPVOTE: "bg-amber-800 text-amber-200",
  RANK: "bg-cyan-800 text-cyan-200",
};

const ROLE_COLORS: Record<string, string> = {
  PM: "bg-blue-600", ADMIN: "bg-purple-600", ENGINEERING: "bg-green-700",
  CS: "bg-amber-600", SALES: "bg-rose-600", IMPLEMENTATION: "bg-cyan-700",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function groupByDate(activities: BacklogActivity[]): Record<string, BacklogActivity[]> {
  const groups: Record<string, BacklogActivity[]> = {};
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  for (const a of activities) {
    const d = new Date(a.createdAt).toDateString();
    const label = d === today ? "Today" : d === yesterday ? "Yesterday" : new Date(a.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(a);
  }
  return groups;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<BacklogActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.backlog.activity({ limit: 50 })
      .then(setActivities)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const groups = groupByDate(activities);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Activity</h1>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {activities.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center text-slate-400">
          No activity yet.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([date, acts]) => (
            <div key={date}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{date}</h2>
              <div className="space-y-2">
                {acts.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-200">{a.userName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${ROLE_COLORS[a.userRole] ?? "bg-slate-600"}`}>
                          {a.userRole}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANGE_COLORS[a.action] ?? "bg-slate-600 text-slate-200"}`}>
                          {a.action}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 mt-1">
                        {a.entityTitle ? (
                          <>
                            {a.action.toLowerCase()}{a.action === "COMMENT" ? "ed on" : "d"}{" "}
                            <Link href={`/backlog/${a.entityId}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                              {a.entityTitle}
                            </Link>
                          </>
                        ) : (
                          <span className="text-slate-500">Activity recorded</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0 mt-0.5">{timeAgo(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
