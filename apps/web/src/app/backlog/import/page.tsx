"use client";

import { useRef, useState } from "react";
import { api, BacklogItem, DuplicatePair, JiraIssue } from "@/lib/api";
import { Spinner } from "@/components/spinner";

const BACKLOG_FIELDS = [
  { value: "skip", label: "Skip" },
  { value: "title", label: "Title" },
  { value: "description", label: "Description" },
  { value: "customerSegment", label: "Customer Segment" },
  { value: "customersImpacted", label: "Customers Impacted" },
  { value: "arrRepresented", label: "ARR Represented" },
  { value: "churnRisk", label: "Churn Risk" },
  { value: "supportingEvidence", label: "Supporting Evidence" },
  { value: "roadmapQuarter", label: "Roadmap Quarter" },
  { value: "notes", label: "Notes" },
];

function DuplicateResolver({ pairs, onResolved }: { pairs: DuplicatePair[]; onResolved: () => void }) {
  const [mergeId, setMergeId] = useState<string | null>(null);
  const [mergeTitle, setMergeTitle] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  async function resolve(pair: DuplicatePair, action: "KEEP_BOTH" | "MERGE" | "DISCARD", mergedData?: Partial<BacklogItem>) {
    setResolving(pair.id);
    try {
      await api.import.resolveDuplicate({ primaryId: pair.primary.id, secondaryId: pair.secondary.id, action, mergedData });
      setResolved((s) => new Set([...s, pair.id]));
      if (resolved.size + 1 >= pairs.length) onResolved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to resolve");
    } finally {
      setResolving(null);
    }
  }

  const pending = pairs.filter((p) => !resolved.has(p.id));

  if (pending.length === 0) return (
    <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
      All duplicates resolved.
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-200">Duplicate Resolution ({pending.length} remaining)</h3>
      {pending.map((pair) => (
        <div key={pair.id} className="bg-slate-800 border border-amber-700/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium">Similarity: {Math.round(pair.similarity * 100)}%</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 uppercase">Primary</div>
              <div className="text-sm text-slate-200 font-medium">{pair.primary.title}</div>
              <div className="text-xs text-slate-500">{pair.primary.product?.name}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500 uppercase">Secondary</div>
              <div className="text-sm text-slate-200 font-medium">{pair.secondary.title}</div>
              <div className="text-xs text-slate-500">{pair.secondary.product?.name}</div>
            </div>
          </div>
          {mergeId === pair.id && (
            <div className="space-y-2">
              <input
                type="text"
                value={mergeTitle}
                onChange={(e) => setMergeTitle(e.target.value)}
                placeholder="Merged title"
                defaultValue={pair.primary.title}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => resolve(pair, "MERGE", { title: mergeTitle || pair.primary.title })}
                disabled={resolving === pair.id}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md disabled:opacity-60 transition-colors"
              >
                {resolving === pair.id ? "Merging..." : "Confirm Merge"}
              </button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => resolve(pair, "KEEP_BOTH")} disabled={resolving === pair.id} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-md disabled:opacity-60 transition-colors">Keep Both</button>
            <button onClick={() => { setMergeId(pair.id); setMergeTitle(pair.primary.title); }} className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800 text-blue-300 text-xs rounded-md transition-colors">Merge</button>
            <button onClick={() => resolve(pair, "DISCARD")} disabled={resolving === pair.id} className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 text-xs rounded-md disabled:opacity-60 transition-colors">Discard Secondary</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CsvImportTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<{ columns: string[]; rows: Record<string, string>[]; total: number } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; duplicates: DuplicatePair[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.import.csvPreview(file);
      setPreview(data);
      const initial: Record<string, string> = {};
      data.columns.forEach((c) => { initial[c] = "skip"; });
      setMapping(initial);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse CSV");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    setError(null);
    try {
      const res = await api.import.csvConfirm(mapping, preview.rows);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragging ? "border-blue-500 bg-blue-900/20" : "border-slate-600 hover:border-slate-500"
        }`}
      >
        <div className="text-4xl mb-3">📄</div>
        <div className="text-slate-300 font-medium">Drop a CSV file here, or click to browse</div>
        <div className="text-slate-500 text-sm mt-1">Accepts .csv files</div>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      </div>

      {loading && <Spinner />}
      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {preview && !result && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Map Columns ({preview.total} total rows)</h3>
            <div className="grid grid-cols-2 gap-3">
              {preview.columns.map((col) => (
                <div key={col} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-300 flex-1 truncate">{col}</span>
                  <select
                    value={mapping[col] ?? "skip"}
                    onChange={(e) => setMapping((m) => ({ ...m, [col]: e.target.value }))}
                    className="text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                  >
                    {BACKLOG_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Preview (first 5 rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-700 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    {preview.columns.map((c) => (
                      <th key={c} className="px-3 py-2 text-left text-slate-400 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {preview.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="bg-slate-900/50">
                      {preview.columns.map((c) => (
                        <td key={c} className="px-3 py-2 text-slate-300 max-w-32 truncate">{row[c] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
          >
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
            Successfully imported {result.imported} items.
          </div>
          {result.duplicates.length > 0 && (
            <DuplicateResolver pairs={result.duplicates} onResolved={() => {}} />
          )}
        </div>
      )}
    </div>
  );
}

function JiraImportTab() {
  const [host, setHost] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [jiraType, setJiraType] = useState<"CLOUD" | "SERVER">("CLOUD");
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; duplicates: DuplicatePair[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    setFetching(true);
    setError(null);
    try {
      const data = await api.import.jiraPreview({ host, email, token, projectKey, type: jiraType });
      const withSelected = data.map((i) => ({ ...i, selected: true }));
      setIssues(withSelected);
      setSelected(new Set(withSelected.map((i) => i.key)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch issues");
    } finally {
      setFetching(false);
    }
  }

  async function handleImport() {
    const toImport = issues.filter((i) => selected.has(i.key));
    setImporting(true);
    setError(null);
    try {
      const res = await api.import.jiraConfirm(toImport);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function toggleSelect(key: string) {
    setSelected((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  }

  const inputCls = "w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Jira Host</label>
            <input type="text" value={host} onChange={(e) => setHost(e.target.value)} className={inputCls} placeholder="timeclockplus.atlassian.net" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>API Token</label>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Project Key</label>
            <input type="text" value={projectKey} onChange={(e) => setProjectKey(e.target.value)} className={inputCls} placeholder="TCP" />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <div className="flex gap-4 mt-2">
              {(["CLOUD", "SERVER"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={t} checked={jiraType === t} onChange={() => setJiraType(t)} className="accent-blue-500" />
                  <span className="text-sm text-slate-300">{t}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={handleFetch}
          disabled={fetching || !host || !email || !token || !projectKey}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
        >
          {fetching ? "Fetching..." : "Fetch Issues"}
        </button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {issues.length > 0 && !result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">{issues.length} issues found</h3>
            <div className="flex gap-2">
              <button onClick={() => setSelected(new Set(issues.map((i) => i.key)))} className="text-xs text-blue-400 hover:text-blue-300">Select All</button>
              <span className="text-slate-600">|</span>
              <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-white">Clear</button>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-2 text-left w-8"><input type="checkbox" checked={selected.size === issues.length} onChange={(e) => e.target.checked ? setSelected(new Set(issues.map((i) => i.key))) : setSelected(new Set())} className="accent-blue-500" /></th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400">Key</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400">Summary</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {issues.map((issue) => (
                  <tr key={issue.key} className="hover:bg-slate-700/30">
                    <td className="px-4 py-2.5"><input type="checkbox" checked={selected.has(issue.key)} onChange={() => toggleSelect(issue.key)} className="accent-blue-500" /></td>
                    <td className="px-4 py-2.5 text-blue-400 font-mono text-xs">{issue.key}</td>
                    <td className="px-4 py-2.5 text-slate-200 max-w-xs truncate">{issue.summary}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{issue.status ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{issue.priority ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
            >
              {importing ? "Importing..." : `Import Selected (${selected.size})`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">
            Successfully imported {result.imported} items from Jira.
          </div>
          {result.duplicates.length > 0 && (
            <DuplicateResolver pairs={result.duplicates} onResolved={() => {}} />
          )}
        </div>
      )}
    </div>
  );
}

const TABS = ["CSV Import", "Jira Import"];

export default function ImportPage() {
  const [tab, setTab] = useState(0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Import</h1>
        <p className="text-slate-400 text-sm mt-1">Import backlog items from CSV files or Jira projects.</p>
      </div>

      <div className="flex gap-1 border-b border-slate-700">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === i ? "text-blue-400 border-blue-400" : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 ? <CsvImportTab /> : <JiraImportTab />}
    </div>
  );
}
