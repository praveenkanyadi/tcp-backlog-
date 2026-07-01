"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, BacklogTaxonomy } from "@/lib/api";
import { Spinner } from "@/components/spinner";

const STEPS = [
  { label: "Basic Info" },
  { label: "Customer Impact" },
  { label: "Business Impact" },
  { label: "Planning" },
];

const CHURN_RISKS = ["NONE", "LOW", "MEDIUM", "HIGH"];

type FormData = {
  title: string;
  description: string;
  productId: string;
  productAreaId: string;
  sourceId: string;
  statusId: string;
  customersImpacted: string;
  arrRepresented: string;
  churnRisk: string;
  customerSegment: string;
  supportingEvidence: string;
  revenueOpportunity: string;
  isComplianceReq: boolean;
  isCompetitiveGap: boolean;
  strategicNotes: string;
  discoveryStatus: string;
  problemStatement: string;
  successMetrics: string;
  targetReleaseId: string;
  roadmapQuarter: string;
};

export default function NewBacklogPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [taxonomy, setTaxonomy] = useState<BacklogTaxonomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    productId: "",
    productAreaId: "",
    sourceId: "",
    statusId: "",
    customersImpacted: "",
    arrRepresented: "",
    churnRisk: "NONE",
    customerSegment: "",
    supportingEvidence: "",
    revenueOpportunity: "",
    isComplianceReq: false,
    isCompetitiveGap: false,
    strategicNotes: "",
    discoveryStatus: "",
    problemStatement: "",
    successMetrics: "",
    targetReleaseId: "",
    roadmapQuarter: "",
  });

  useEffect(() => {
    api.backlog.taxonomy().then((t) => {
      setTaxonomy(t);
      if (t.statuses.length > 0) setForm((f) => ({ ...f, statusId: t.statuses[0].id }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function set(key: keyof FormData, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "productId") setForm((f) => ({ ...f, productAreaId: "", [key]: value as string }));
  }

  const filteredAreas = taxonomy?.areas.filter((a) => a.productId === form.productId) ?? [];

  async function handleSubmit() {
    if (!form.title.trim()) { setError("Title is required"); setStep(0); return; }
    if (!form.productId) { setError("Product is required"); setStep(0); return; }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        productId: form.productId || undefined,
        productAreaId: form.productAreaId || undefined,
        sourceId: form.sourceId || undefined,
        statusId: form.statusId || undefined,
        customersImpacted: form.customersImpacted ? Number(form.customersImpacted) : undefined,
        arrRepresented: form.arrRepresented ? Number(form.arrRepresented) : undefined,
        churnRisk: form.churnRisk as "NONE" | "LOW" | "MEDIUM" | "HIGH",
        customerSegment: form.customerSegment || undefined,
        supportingEvidence: form.supportingEvidence || undefined,
        revenueOpportunity: form.revenueOpportunity ? Number(form.revenueOpportunity) : undefined,
        complianceRequirement: form.isComplianceReq,
        competitiveGap: form.isCompetitiveGap,
        strategicNotes: form.strategicNotes || undefined,
        discoveryStatus: form.discoveryStatus || undefined,
        problemStatement: form.problemStatement || undefined,
        successMetrics: form.successMetrics || undefined,
        targetReleaseId: form.targetReleaseId || undefined,
        roadmapQuarter: form.roadmapQuarter || undefined,
      };
      const item = await api.backlog.create(payload);
      router.push(`/backlog/${item.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create item");
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner />;

  const inputCls = "w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <a onClick={() => router.back()} className="text-slate-400 hover:text-white cursor-pointer text-sm">← Back</a>
        <h1 className="text-xl font-bold text-slate-100 ml-2">New Backlog Item</h1>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                i === step ? "text-blue-400" : i < step ? "text-slate-300 cursor-pointer hover:text-white" : "text-slate-600"
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step ? "bg-blue-600 text-white" : i < step ? "bg-slate-600 text-slate-200" : "bg-slate-800 text-slate-600 border border-slate-700"
              }`}>{i + 1}</span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-slate-700" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-5">
        {/* Step 1 */}
        {step === 0 && (
          <>
            <div>
              <label className={labelCls}>Title <span className="text-red-400">*</span></label>
              <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls} placeholder="Describe the feature or request" />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={inputCls} placeholder="Provide additional context..." />
            </div>
            <div>
              <label className={labelCls}>Product <span className="text-red-400">*</span></label>
              <select value={form.productId} onChange={(e) => set("productId", e.target.value)} className={inputCls}>
                <option value="">Select a product</option>
                {taxonomy?.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Product Area</label>
              <select value={form.productAreaId} onChange={(e) => set("productAreaId", e.target.value)} className={inputCls} disabled={!form.productId}>
                <option value="">Select an area</option>
                {filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <select value={form.sourceId} onChange={(e) => set("sourceId", e.target.value)} className={inputCls}>
                <option value="">Select a source</option>
                {taxonomy?.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.statusId} onChange={(e) => set("statusId", e.target.value)} className={inputCls}>
                {taxonomy?.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <>
            <div>
              <label className={labelCls}>Customers Impacted</label>
              <input type="number" value={form.customersImpacted} onChange={(e) => set("customersImpacted", e.target.value)} className={inputCls} placeholder="0" min="0" />
            </div>
            <div>
              <label className={labelCls}>ARR Represented ($)</label>
              <input type="number" value={form.arrRepresented} onChange={(e) => set("arrRepresented", e.target.value)} className={inputCls} placeholder="0" min="0" />
            </div>
            <div>
              <label className={labelCls}>Churn Risk</label>
              <select value={form.churnRisk} onChange={(e) => set("churnRisk", e.target.value)} className={inputCls}>
                {CHURN_RISKS.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Customer Segment</label>
              <input type="text" value={form.customerSegment} onChange={(e) => set("customerSegment", e.target.value)} className={inputCls} placeholder="e.g. Enterprise, SMB" />
            </div>
            <div>
              <label className={labelCls}>Supporting Evidence</label>
              <textarea value={form.supportingEvidence} onChange={(e) => set("supportingEvidence", e.target.value)} rows={4} className={inputCls} placeholder="Customer quotes, tickets, data..." />
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <>
            <div>
              <label className={labelCls}>Revenue Opportunity ($)</label>
              <input type="number" value={form.revenueOpportunity} onChange={(e) => set("revenueOpportunity", e.target.value)} className={inputCls} placeholder="0" min="0" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="compliance" checked={form.isComplianceReq} onChange={(e) => set("isComplianceReq", e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <label htmlFor="compliance" className="text-sm text-slate-300 cursor-pointer">Compliance Requirement</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="competitive" checked={form.isCompetitiveGap} onChange={(e) => set("isCompetitiveGap", e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <label htmlFor="competitive" className="text-sm text-slate-300 cursor-pointer">Competitive Gap</label>
            </div>
            <div>
              <label className={labelCls}>Strategic Notes</label>
              <textarea value={form.strategicNotes} onChange={(e) => set("strategicNotes", e.target.value)} rows={4} className={inputCls} placeholder="Why does this matter strategically?" />
            </div>
          </>
        )}

        {/* Step 4 */}
        {step === 3 && (
          <>
            <div>
              <label className={labelCls}>Discovery Status</label>
              <select value={form.discoveryStatus} onChange={(e) => set("discoveryStatus", e.target.value)} className={inputCls}>
                <option value="">Select a status</option>
                {taxonomy?.discoveryStatuses.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Problem Statement</label>
              <textarea value={form.problemStatement} onChange={(e) => set("problemStatement", e.target.value)} rows={3} className={inputCls} placeholder="What problem does this solve?" />
            </div>
            <div>
              <label className={labelCls}>Success Metrics</label>
              <textarea value={form.successMetrics} onChange={(e) => set("successMetrics", e.target.value)} rows={3} className={inputCls} placeholder="How will we measure success?" />
            </div>
            <div>
              <label className={labelCls}>Target Release</label>
              <select value={form.targetReleaseId} onChange={(e) => set("targetReleaseId", e.target.value)} className={inputCls}>
                <option value="">Select a release</option>
                {taxonomy?.releases.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Roadmap Quarter</label>
              <select value={form.roadmapQuarter} onChange={(e) => set("roadmapQuarter", e.target.value)} className={inputCls}>
                <option value="">Select a quarter</option>
                {taxonomy?.roadmapQuarters.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
          >
            {submitting ? "Creating..." : "Create Item"}
          </button>
        )}
      </div>
    </div>
  );
}
