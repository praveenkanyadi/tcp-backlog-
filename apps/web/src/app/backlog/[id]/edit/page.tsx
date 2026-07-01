"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, BacklogItem, BacklogTaxonomy } from "@/lib/api";
import { getCurrentUser, DemoUser } from "@/lib/auth";
import { Spinner } from "@/components/spinner";

const TABS = ["Basic Info", "Customer Impact", "Business Impact", "Planning", "Engineering"];
const EFFORT_OPTIONS = ["XS", "S", "M", "L", "XL"];
const COMPLEXITY_OPTIONS = ["Low", "Medium", "High", "Very High"];
const CONFIDENCE_OPTIONS = ["Low", "Medium", "High"];
const CHURN_RISKS = ["NONE", "LOW", "MEDIUM", "HIGH"];

export default function EditBacklogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [item, setItem] = useState<BacklogItem | null>(null);
  const [taxonomy, setTaxonomy] = useState<BacklogTaxonomy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<DemoUser>(getCurrentUser());

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [productId, setProductId] = useState("");
  const [productAreaId, setProductAreaId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [statusId, setStatusId] = useState("");

  const [customersImpacted, setCustomersImpacted] = useState("");
  const [arrRepresented, setArrRepresented] = useState("");
  const [churnRisk, setChurnRisk] = useState("NONE");
  const [customerSegment, setCustomerSegment] = useState("");
  const [supportingEvidence, setSupportingEvidence] = useState("");

  const [revenueOpportunity, setRevenueOpportunity] = useState("");
  const [isComplianceReq, setIsComplianceReq] = useState(false);
  const [isCompetitiveGap, setIsCompetitiveGap] = useState(false);
  const [strategicNotes, setStrategicNotes] = useState("");

  const [discoveryStatus, setDiscoveryStatus] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [successMetrics, setSuccessMetrics] = useState("");
  const [targetReleaseId, setTargetReleaseId] = useState("");
  const [roadmapQuarter, setRoadmapQuarter] = useState("");
  const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([]);

  const [engEffort, setEngEffort] = useState("");
  const [engComplexity, setEngComplexity] = useState("");
  const [engTechnicalDeps, setEngTechnicalDeps] = useState("");
  const [engRisks, setEngRisks] = useState("");
  const [engConfidence, setEngConfidence] = useState("");

  useEffect(() => {
    const handler = () => setUser(getCurrentUser());
    window.addEventListener("userChange", handler);
    return () => window.removeEventListener("userChange", handler);
  }, []);

  useEffect(() => {
    Promise.all([api.backlog.get(id), api.backlog.taxonomy()]).then(([it, tax]) => {
      setItem(it);
      setTaxonomy(tax);
      setTitle(it.title ?? "");
      setDescription(it.description ?? "");
      setProductId(it.productId ?? "");
      setProductAreaId(it.productAreaId ?? "");
      setSourceId(it.sourceId ?? "");
      setStatusId(it.statusId ?? "");
      setCustomersImpacted(it.customersImpacted?.toString() ?? "");
      setArrRepresented(it.arrRepresented?.toString() ?? "");
      setChurnRisk(it.churnRisk ?? "NONE");
      setCustomerSegment(it.customerSegment ?? "");
      setSupportingEvidence(it.supportingEvidence ?? "");
      setRevenueOpportunity(it.revenueOpportunity?.toString() ?? "");
      setIsComplianceReq(it.complianceRequirement ?? false);
      setIsCompetitiveGap(it.competitiveGap ?? false);
      setStrategicNotes(it.strategicNotes ?? "");
      setDiscoveryStatus(it.discoveryStatus ?? "");
      setProblemStatement(it.problemStatement ?? "");
      setSuccessMetrics(it.successMetrics ?? "");
      setTargetReleaseId(it.targetReleaseId ?? "");
      setRoadmapQuarter(it.roadmapQuarter ?? "");
      setSelectedInitiatives(it.initiatives?.map((i) => i.id) ?? []);
      setEngEffort(it.engEffort ?? "");
      setEngComplexity(it.engComplexity ?? "");
      setEngTechnicalDeps(it.engTechnicalDeps ?? "");
      setEngRisks(it.engRisks ?? "");
      setEngConfidence(it.engConfidence?.toString() ?? "");
    }).catch((e) => setError(e instanceof Error ? e.message : "Failed to load")).finally(() => setLoading(false));
  }, [id]);

  const filteredAreas = taxonomy?.areas.filter((a) => a.productId === productId) ?? [];
  const canEngineer = ["ENGINEERING", "PM", "ADMIN"].includes(user.role);
  const visibleTabs = canEngineer ? TABS : TABS.slice(0, 4);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title, description: description || undefined,
        productId: productId || undefined,
        productAreaId: productAreaId || undefined,
        sourceId: sourceId || undefined,
        statusId: statusId || undefined,
        customersImpacted: customersImpacted ? Number(customersImpacted) : undefined,
        arrRepresented: arrRepresented ? Number(arrRepresented) : undefined,
        churnRisk: churnRisk as "NONE" | "LOW" | "MEDIUM" | "HIGH",
        customerSegment: customerSegment || undefined,
        supportingEvidence: supportingEvidence || undefined,
        revenueOpportunity: revenueOpportunity ? Number(revenueOpportunity) : undefined,
        complianceRequirement: isComplianceReq,
        competitiveGap: isCompetitiveGap,
        strategicNotes: strategicNotes || undefined,
        discoveryStatus: discoveryStatus || undefined,
        problemStatement: problemStatement || undefined,
        successMetrics: successMetrics || undefined,
        targetReleaseId: targetReleaseId || undefined,
        roadmapQuarter: roadmapQuarter || undefined,
        initiativeIds: selectedInitiatives,
      };
      await api.backlog.update(id, payload);

      if (tab === 4 && canEngineer && engEffort) {
        await api.backlog.engReview(id, {
          estimatedEffort: engEffort || undefined,
          complexity: engComplexity || undefined,
          technicalDeps: engTechnicalDeps || undefined,
          risks: engRisks || undefined,
          confidenceLevel: engConfidence || undefined,
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.push(`/backlog/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleEngSave() {
    setSaving(true);
    setError(null);
    try {
      await api.backlog.engReview(id, {
        estimatedEffort: engEffort || undefined,
        complexity: engComplexity || undefined,
        technicalDeps: engTechnicalDeps || undefined,
        risks: engRisks || undefined,
        confidenceLevel: engConfidence || undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save engineering review");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (!item) return <div className="text-red-400">{error ?? "Item not found"}</div>;

  const inputCls = "w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500";
  const labelCls = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/backlog/${id}`} className="text-slate-400 hover:text-white text-sm">← Back</Link>
        <h1 className="text-xl font-bold text-slate-100">Edit Item</h1>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm">Saved successfully!</div>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 overflow-x-auto">
        {visibleTabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === i ? "text-blue-400 border-blue-400" : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-5">
        {/* Basic Info */}
        {tab === 0 && (
          <>
            <div>
              <label className={labelCls}>Title <span className="text-red-400">*</span></label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Product</label>
              <select value={productId} onChange={(e) => { setProductId(e.target.value); setProductAreaId(""); }} className={inputCls}>
                <option value="">Select a product</option>
                {taxonomy?.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Product Area</label>
              <select value={productAreaId} onChange={(e) => setProductAreaId(e.target.value)} className={inputCls} disabled={!productId}>
                <option value="">Select an area</option>
                {filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={inputCls}>
                <option value="">Select a source</option>
                {taxonomy?.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={statusId} onChange={(e) => setStatusId(e.target.value)} className={inputCls}>
                <option value="">Select a status</option>
                {taxonomy?.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Customer Impact */}
        {tab === 1 && (
          <>
            <div>
              <label className={labelCls}>Customers Impacted</label>
              <input type="number" value={customersImpacted} onChange={(e) => setCustomersImpacted(e.target.value)} className={inputCls} min="0" />
            </div>
            <div>
              <label className={labelCls}>ARR Represented ($)</label>
              <input type="number" value={arrRepresented} onChange={(e) => setArrRepresented(e.target.value)} className={inputCls} min="0" />
            </div>
            <div>
              <label className={labelCls}>Churn Risk</label>
              <select value={churnRisk} onChange={(e) => setChurnRisk(e.target.value)} className={inputCls}>
                {CHURN_RISKS.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Customer Segment</label>
              <input type="text" value={customerSegment} onChange={(e) => setCustomerSegment(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Supporting Evidence</label>
              <textarea value={supportingEvidence} onChange={(e) => setSupportingEvidence(e.target.value)} rows={4} className={inputCls} />
            </div>
          </>
        )}

        {/* Business Impact */}
        {tab === 2 && (
          <>
            <div>
              <label className={labelCls}>Revenue Opportunity ($)</label>
              <input type="number" value={revenueOpportunity} onChange={(e) => setRevenueOpportunity(e.target.value)} className={inputCls} min="0" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="edit-compliance" checked={isComplianceReq} onChange={(e) => setIsComplianceReq(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <label htmlFor="edit-compliance" className="text-sm text-slate-300 cursor-pointer">Compliance Requirement</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="edit-competitive" checked={isCompetitiveGap} onChange={(e) => setIsCompetitiveGap(e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <label htmlFor="edit-competitive" className="text-sm text-slate-300 cursor-pointer">Competitive Gap</label>
            </div>
            <div>
              <label className={labelCls}>Strategic Notes</label>
              <textarea value={strategicNotes} onChange={(e) => setStrategicNotes(e.target.value)} rows={4} className={inputCls} />
            </div>
          </>
        )}

        {/* Planning */}
        {tab === 3 && (
          <>
            <div>
              <label className={labelCls}>Discovery Status</label>
              <select value={discoveryStatus} onChange={(e) => setDiscoveryStatus(e.target.value)} className={inputCls}>
                <option value="">Select a status</option>
                {taxonomy?.discoveryStatuses.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Problem Statement</label>
              <textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} rows={3} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Success Metrics</label>
              <textarea value={successMetrics} onChange={(e) => setSuccessMetrics(e.target.value)} rows={3} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Target Release</label>
              <select value={targetReleaseId} onChange={(e) => setTargetReleaseId(e.target.value)} className={inputCls}>
                <option value="">Select a release</option>
                {taxonomy?.releases.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Roadmap Quarter</label>
              <select value={roadmapQuarter} onChange={(e) => setRoadmapQuarter(e.target.value)} className={inputCls}>
                <option value="">Select a quarter</option>
                {taxonomy?.roadmapQuarters.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Initiatives</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {taxonomy?.initiatives.map((ini) => (
                  <label key={ini.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedInitiatives.includes(ini.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedInitiatives((p) => [...p, ini.id]);
                        else setSelectedInitiatives((p) => p.filter((x) => x !== ini.id));
                      }}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-slate-300">{ini.name}</span>
                    {ini.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ini.color }} />}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Engineering */}
        {tab === 4 && canEngineer && (
          <>
            <div>
              <label className={labelCls}>Estimated Effort</label>
              <select value={engEffort} onChange={(e) => setEngEffort(e.target.value)} className={inputCls}>
                <option value="">Select effort</option>
                {EFFORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Complexity</label>
              <select value={engComplexity} onChange={(e) => setEngComplexity(e.target.value)} className={inputCls}>
                <option value="">Select complexity</option>
                {COMPLEXITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Confidence Level</label>
              <select value={engConfidence} onChange={(e) => setEngConfidence(e.target.value)} className={inputCls}>
                <option value="">Select confidence</option>
                {CONFIDENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Technical Dependencies</label>
              <textarea value={engTechnicalDeps} onChange={(e) => setEngTechnicalDeps(e.target.value)} rows={3} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Risks</label>
              <textarea value={engRisks} onChange={(e) => setEngRisks(e.target.value)} rows={3} className={inputCls} />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between">
        <Link href={`/backlog/${id}`} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors">
          Cancel
        </Link>
        <div className="flex gap-2">
          {tab === 4 && canEngineer && (
            <button
              onClick={handleEngSave}
              disabled={saving}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving..." : "Save Eng Review"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
