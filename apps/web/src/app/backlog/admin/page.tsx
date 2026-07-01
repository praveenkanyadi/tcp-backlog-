"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  AdminUser,
  BacklogInitiative,
  BacklogProduct,
  BacklogProductArea,
  BacklogRelease,
  BacklogSource,
  BacklogStatus,
} from "@/lib/api";
import { Spinner } from "@/components/spinner";

const TABS = ["Products", "Areas", "Statuses", "Sources", "Initiatives", "Releases", "Config", "Users"];
const ROLES = ["PM", "ENGINEERING", "CS", "SALES", "IMPLEMENTATION", "ADMIN"];

type Toast = { id: number; message: string; type: "success" | "error" };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  function show(message: string, type: "success" | "error" = "success") {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((t) => (
        <div key={t.id} className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
          t.type === "success" ? "bg-green-800 text-green-100 border border-green-600" : "bg-red-800 text-red-100 border border-red-600"
        }`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

const inputCls = "px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500";
const btnPrimary = "px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60";
const btnDanger = "px-2 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 text-xs rounded-md transition-colors";

function ProductsTab({ toast }: { toast: (msg: string, t?: "success" | "error") => void }) {
  const [items, setItems] = useState<BacklogProduct[]>([]);
  const [portfolios, setPortfolios] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [portfolioId, setPortfolioId] = useState("");

  async function load() {
    const [prods, tax] = await Promise.all([api.admin.listProducts(), api.backlog.taxonomy()]);
    setItems(prods);
    setPortfolios(tax.portfolios);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    try {
      await api.admin.createProduct({ name, portfolioId: portfolioId || undefined });
      setName(""); setPortfolioId(""); load(); toast("Product created");
    } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }

  async function del(id: string) {
    if (!confirm("Delete product?")) return;
    try { await api.admin.deleteProduct(id); load(); toast("Deleted"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }

  if (loading) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className={inputCls} />
        <select value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)} className={inputCls}>
          <option value="">No portfolio</option>
          {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={add} disabled={!name.trim()} className={btnPrimary}>Add</button>
      </div>
      <table className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <thead><tr className="border-b border-slate-700">
          {["Name", "Portfolio", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-700/50">
          {items.map((p) => (
            <tr key={p.id} className="hover:bg-slate-700/30">
              <td className="px-4 py-3 text-slate-200">{p.name}</td>
              <td className="px-4 py-3 text-slate-400">{portfolios.find((x) => x.id === p.portfolioId)?.name ?? "—"}</td>
              <td className="px-4 py-3"><button onClick={() => del(p.id)} className={btnDanger}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AreasTab({ toast }: { toast: (msg: string, t?: "success" | "error") => void }) {
  const [items, setItems] = useState<BacklogProductArea[]>([]);
  const [products, setProducts] = useState<BacklogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");

  async function load() {
    const [areas, prods] = await Promise.all([api.admin.listAreas(), api.admin.listProducts()]);
    setItems(areas); setProducts(prods); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    try { await api.admin.createArea({ name, productId }); setName(""); load(); toast("Area created"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }
  async function del(id: string) {
    if (!confirm("Delete area?")) return;
    try { await api.admin.deleteArea(id); load(); toast("Deleted"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }

  if (loading) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Area name" className={inputCls} />
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
          <option value="">Select product</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={add} disabled={!name.trim() || !productId} className={btnPrimary}>Add</button>
      </div>
      <table className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <thead><tr className="border-b border-slate-700">
          {["Name", "Product", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-700/50">
          {items.map((a) => (
            <tr key={a.id} className="hover:bg-slate-700/30">
              <td className="px-4 py-3 text-slate-200">{a.name}</td>
              <td className="px-4 py-3 text-slate-400">{products.find((p) => p.id === a.productId)?.name ?? "—"}</td>
              <td className="px-4 py-3"><button onClick={() => del(a.id)} className={btnDanger}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusesTab({ toast }: { toast: (msg: string, t?: "success" | "error") => void }) {
  const [items, setItems] = useState<BacklogStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#475569");

  async function load() { setItems(await api.admin.listStatuses()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function add() {
    try { await api.admin.createStatus({ name, color }); setName(""); load(); toast("Status created"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }
  async function del(id: string) {
    if (!confirm("Delete status?")) return;
    try { await api.admin.deleteStatus(id); load(); toast("Deleted"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }

  if (loading) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Status name" className={inputCls} />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer bg-slate-900 border border-slate-700" />
        <button onClick={add} disabled={!name.trim()} className={btnPrimary}>Add</button>
      </div>
      <table className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <thead><tr className="border-b border-slate-700">
          {["Name", "Color", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-700/50">
          {items.map((s) => (
            <tr key={s.id} className="hover:bg-slate-700/30">
              <td className="px-4 py-3 text-slate-200">{s.name}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-slate-600" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-500 text-xs font-mono">{s.color}</span>
                </span>
              </td>
              <td className="px-4 py-3"><button onClick={() => del(s.id)} className={btnDanger}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourcesTab({ toast }: { toast: (msg: string, t?: "success" | "error") => void }) {
  const [items, setItems] = useState<BacklogSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  async function load() { setItems(await api.admin.listSources()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function add() {
    try { await api.admin.createSource({ name }); setName(""); load(); toast("Source created"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }
  async function del(id: string) {
    if (!confirm("Delete source?")) return;
    try { await api.admin.deleteSource(id); load(); toast("Deleted"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }

  if (loading) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Source name" className={inputCls} />
        <button onClick={add} disabled={!name.trim()} className={btnPrimary}>Add</button>
      </div>
      <table className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <thead><tr className="border-b border-slate-700">
          {["Name", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-700/50">
          {items.map((s) => (
            <tr key={s.id} className="hover:bg-slate-700/30">
              <td className="px-4 py-3 text-slate-200">{s.name}</td>
              <td className="px-4 py-3"><button onClick={() => del(s.id)} className={btnDanger}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InitiativesTab({ toast }: { toast: (msg: string, t?: "success" | "error") => void }) {
  const [items, setItems] = useState<BacklogInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");

  async function load() { setItems(await api.admin.listInitiatives()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function add() {
    try { await api.admin.createInitiative({ name, color }); setName(""); load(); toast("Initiative created"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }
  async function del(id: string) {
    if (!confirm("Delete initiative?")) return;
    try { await api.admin.deleteInitiative(id); load(); toast("Deleted"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }

  if (loading) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Initiative name" className={inputCls} />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer bg-slate-900 border border-slate-700" />
        <button onClick={add} disabled={!name.trim()} className={btnPrimary}>Add</button>
      </div>
      <table className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <thead><tr className="border-b border-slate-700">
          {["Name", "Color", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-700/50">
          {items.map((i) => (
            <tr key={i.id} className="hover:bg-slate-700/30">
              <td className="px-4 py-3 text-slate-200">{i.name}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-slate-600" style={{ backgroundColor: i.color ?? "#475569" }} />
                  <span className="text-slate-500 text-xs font-mono">{i.color}</span>
                </span>
              </td>
              <td className="px-4 py-3"><button onClick={() => del(i.id)} className={btnDanger}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReleasesTab({ toast }: { toast: (msg: string, t?: "success" | "error") => void }) {
  const [items, setItems] = useState<BacklogRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  async function load() { setItems(await api.admin.listReleases()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function add() {
    try { await api.admin.createRelease({ name }); setName(""); load(); toast("Release created"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }
  async function del(id: string) {
    if (!confirm("Delete release?")) return;
    try { await api.admin.deleteRelease(id); load(); toast("Deleted"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }

  if (loading) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Release name" className={inputCls} />
        <button onClick={add} disabled={!name.trim()} className={btnPrimary}>Add</button>
      </div>
      <table className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <thead><tr className="border-b border-slate-700">
          {["Name", "Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-700/50">
          {items.map((r) => (
            <tr key={r.id} className="hover:bg-slate-700/30">
              <td className="px-4 py-3 text-slate-200">{r.name}</td>
              <td className="px-4 py-3"><button onClick={() => del(r.id)} className={btnDanger}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfigTab({ toast }: { toast: (msg: string, t?: "success" | "error") => void }) {
  const [discoveryStatuses, setDiscoveryStatuses] = useState<string[]>([]);
  const [roadmapQuarters, setRoadmapQuarters] = useState<string[]>([]);
  const [newDs, setNewDs] = useState("");
  const [newRq, setNewRq] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.getConfig().then((c) => { setDiscoveryStatuses(c.discoveryStatuses); setRoadmapQuarters(c.roadmapQuarters); }).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try { await api.admin.updateConfig({ discoveryStatuses, roadmapQuarters }); toast("Config saved"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Discovery Statuses</h3>
        <div className="flex flex-wrap gap-2">
          {discoveryStatuses.map((s) => (
            <span key={s} className="flex items-center gap-1 px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-200">
              {s}
              <button onClick={() => setDiscoveryStatuses((prev) => prev.filter((x) => x !== s))} className="text-slate-400 hover:text-red-400 ml-1">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newDs} onChange={(e) => setNewDs(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newDs.trim()) { setDiscoveryStatuses((p) => [...p, newDs.trim()]); setNewDs(""); } }} placeholder="Add status (press Enter)" className={`${inputCls} flex-1`} />
          <button onClick={() => { if (newDs.trim()) { setDiscoveryStatuses((p) => [...p, newDs.trim()]); setNewDs(""); } }} className={btnPrimary}>Add</button>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Roadmap Quarters</h3>
        <div className="flex flex-wrap gap-2">
          {roadmapQuarters.map((q) => (
            <span key={q} className="flex items-center gap-1 px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-200">
              {q}
              <button onClick={() => setRoadmapQuarters((prev) => prev.filter((x) => x !== q))} className="text-slate-400 hover:text-red-400 ml-1">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newRq} onChange={(e) => setNewRq(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newRq.trim()) { setRoadmapQuarters((p) => [...p, newRq.trim()]); setNewRq(""); } }} placeholder="e.g. Q3 2025 (press Enter)" className={`${inputCls} flex-1`} />
          <button onClick={() => { if (newRq.trim()) { setRoadmapQuarters((p) => [...p, newRq.trim()]); setNewRq(""); } }} className={btnPrimary}>Add</button>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : "Save Config"}</button>
      </div>
    </div>
  );
}

function UsersTab({ toast }: { toast: (msg: string, t?: "success" | "error") => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() { setUsers(await api.admin.listUsers()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function changeRole(userId: string, role: string) {
    try { await api.admin.updateUserRole(userId, role); load(); toast("Role updated"); } catch (e) { toast(e instanceof Error ? e.message : "Error", "error"); }
  }

  if (loading) return <Spinner />;
  return (
    <table className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <thead><tr className="border-b border-slate-700">
        {["Name", "Email", "Role"].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
      </tr></thead>
      <tbody className="divide-y divide-slate-700/50">
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-slate-700/30">
            <td className="px-4 py-3 text-slate-200 font-medium">{u.name}</td>
            <td className="px-4 py-3 text-slate-400">{u.email}</td>
            <td className="px-4 py-3">
              <select
                value={u.role}
                onChange={(e) => changeRole(u.id, e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState(0);
  const { toasts, show } = useToast();

  const tabComponents = [
    <ProductsTab key="products" toast={show} />,
    <AreasTab key="areas" toast={show} />,
    <StatusesTab key="statuses" toast={show} />,
    <SourcesTab key="sources" toast={show} />,
    <InitiativesTab key="initiatives" toast={show} />,
    <ReleasesTab key="releases" toast={show} />,
    <ConfigTab key="config" toast={show} />,
    <UsersTab key="users" toast={show} />,
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Admin</h1>

      <div className="flex gap-1 border-b border-slate-700 overflow-x-auto">
        {TABS.map((t, i) => (
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

      {tabComponents[tab]}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
