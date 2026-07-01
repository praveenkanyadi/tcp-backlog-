import { getCurrentUser } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  let user;
  try {
    user = getCurrentUser();
  } catch {
    user = { id: "unknown", name: "Unknown", role: "PM" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-User-Id": user.id,
    "X-User-Name": user.name,
    "X-User-Role": user.role,
    ...(options.headers as Record<string, string> ?? {}),
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface BacklogPortfolio {
  id: string;
  name: string;
  products: BacklogProduct[];
}

export interface BacklogProduct {
  id: string;
  name: string;
  portfolioId?: string;
  areas?: BacklogProductArea[];
}

export interface BacklogProductArea {
  id: string;
  name: string;
  productId: string;
}

export interface BacklogStatus {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface BacklogSource {
  id: string;
  name: string;
  description?: string;
}

export interface BacklogRelease {
  id: string;
  name: string;
  targetDate?: string;
  productId?: string;
}

export interface BacklogInitiative {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

export interface BacklogTaxonomy {
  portfolios: BacklogPortfolio[];
  products: BacklogProduct[];
  areas: BacklogProductArea[];
  statuses: BacklogStatus[];
  sources: BacklogSource[];
  releases: BacklogRelease[];
  initiatives: BacklogInitiative[];
  discoveryStatuses: string[];
  roadmapQuarters: string[];
}

export interface CustomerQuote {
  id: string;
  text: string;
  customerName?: string;
  customerCompany?: string;
  backlogItemId: string;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  authorId?: string | null;
  authorName?: string | null;
  parentId?: string | null;
  replies?: Comment[];
  itemId: string;
}

export interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  priorityScore?: number;
  priorityRank?: number;
  status: BacklogStatus;
  statusId: string;
  product?: BacklogProduct;
  productId?: string;
  productArea?: BacklogProductArea;
  productAreaId?: string;
  source?: BacklogSource;
  sourceId?: string;
  owner?: string;
  ownerId?: string;
  roadmapQuarter?: string;
  targetRelease?: BacklogRelease;
  targetReleaseId?: string;
  initiatives?: BacklogInitiative[];
  customersImpacted?: number;
  arrRepresented?: number;
  churnRisk?: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  customerSegment?: string;
  supportingEvidence?: string;
  revenueOpportunity?: number;
  isComplianceReq?: boolean;
  isCompetitiveGap?: boolean;
  strategicNotes?: string;
  discoveryStatus?: string;
  problemStatement?: string;
  successMetrics?: string;
  published?: boolean;
  publishedAt?: string;
  jiraKey?: string;
  jiraUrl?: string;
  engEffort?: string;
  engComplexity?: string;
  engTechnicalDeps?: string;
  engRisks?: string;
  engConfidence?: number;
  engReviewedAt?: string;
  engReviewedBy?: string;
  customerQuotes?: CustomerQuote[];
  comments?: Comment[];
  _count?: {
    upvotes: number;
    comments: number;
  };
  userUpvoted?: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
}

export interface BacklogActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  userId: string;
  userName: string;
  userRole: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BacklogListResult {
  items: BacklogItem[];
  total: number;
}

export interface RoadmapQuarter {
  quarter: string;
  items: BacklogItem[];
}

// ─── API Object ───────────────────────────────────────────────────────────────

function toQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const api = {
  backlog: {
    list(params: Record<string, unknown> = {}): Promise<BacklogListResult> {
      return fetchApi(`/backlog${toQuery(params)}`);
    },
    get(id: string): Promise<BacklogItem> {
      return fetchApi(`/backlog/${id}`);
    },
    create(data: Partial<BacklogItem>): Promise<BacklogItem> {
      return fetchApi("/backlog", { method: "POST", body: JSON.stringify(data) });
    },
    update(id: string, data: Partial<BacklogItem>): Promise<BacklogItem> {
      return fetchApi(`/backlog/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    delete(id: string): Promise<void> {
      return fetchApi(`/backlog/${id}`, { method: "DELETE" });
    },
    publish(id: string, published: boolean): Promise<BacklogItem> {
      return fetchApi(`/backlog/${id}/publish`, { method: "POST", body: JSON.stringify({ published }) });
    },
    engReview(id: string, data: Record<string, unknown>): Promise<BacklogItem> {
      return fetchApi(`/backlog/${id}/eng-review`, { method: "POST", body: JSON.stringify(data) });
    },
    addComment(id: string, body: string, parentId?: string): Promise<Comment> {
      return fetchApi(`/backlog/${id}/comments`, { method: "POST", body: JSON.stringify({ body, parentId }) });
    },
    deleteComment(id: string, commentId: string): Promise<void> {
      return fetchApi(`/backlog/${id}/comments/${commentId}`, { method: "DELETE" });
    },
    toggleUpvote(id: string): Promise<{ upvoted: boolean; count: number }> {
      return fetchApi(`/backlog/${id}/upvote`, { method: "POST" });
    },
    linkJira(id: string, data: { jiraKey: string; jiraUrl: string }): Promise<BacklogItem> {
      return fetchApi(`/backlog/${id}/jira`, { method: "POST", body: JSON.stringify(data) });
    },
    publishRanking(productId: string, updates: { id: string; priorityRank: number }[]): Promise<void> {
      return fetchApi("/backlog/rank", { method: "POST", body: JSON.stringify({ productId, updates }) });
    },
    portfolio(): Promise<BacklogPortfolio[]> {
      return fetchApi("/backlog/portfolio");
    },
    taxonomy(): Promise<BacklogTaxonomy> {
      return fetchApi("/backlog/taxonomy");
    },
    activity(params: Record<string, unknown> = {}): Promise<BacklogActivity[]> {
      return fetchApi(`/backlog/activity${toQuery(params)}`);
    },
  },

  roadmap: {
    get(quarter?: string): Promise<RoadmapQuarter[]> {
      return fetchApi(`/roadmap${quarter ? `?quarter=${quarter}` : ""}`);
    },
    quarters(): Promise<string[]> {
      return fetchApi("/roadmap/quarters");
    },
  },

  import: {
    csvPreview(file: File): Promise<{ columns: string[]; rows: Record<string, string>[]; total: number }> {
      const form = new FormData();
      form.append("file", file);
      return fetchApi("/import/csv/preview", { method: "POST", body: form });
    },
    csvConfirm(mapping: Record<string, string>, rows: Record<string, string>[]): Promise<{ imported: number; duplicates: DuplicatePair[] }> {
      return fetchApi("/import/csv/confirm", { method: "POST", body: JSON.stringify({ mapping, rows }) });
    },
    jiraPreview(config: { host: string; email: string; token: string; projectKey: string; type: "CLOUD" | "SERVER" }): Promise<JiraIssue[]> {
      return fetchApi("/import/jira/preview", { method: "POST", body: JSON.stringify(config) });
    },
    jiraConfirm(items: JiraIssue[]): Promise<{ imported: number; duplicates: DuplicatePair[] }> {
      return fetchApi("/import/jira/confirm", { method: "POST", body: JSON.stringify({ items }) });
    },
    findDuplicates(): Promise<DuplicatePair[]> {
      return fetchApi("/import/duplicates");
    },
    resolveDuplicate(data: { primaryId: string; secondaryId: string; action: "KEEP_BOTH" | "MERGE" | "DISCARD"; mergedData?: Partial<BacklogItem> }): Promise<void> {
      return fetchApi("/import/duplicates/resolve", { method: "POST", body: JSON.stringify(data) });
    },
  },

  admin: {
    // Products
    listProducts(): Promise<BacklogProduct[]> { return fetchApi("/admin/products"); },
    createProduct(data: Partial<BacklogProduct>): Promise<BacklogProduct> {
      return fetchApi("/admin/products", { method: "POST", body: JSON.stringify(data) });
    },
    updateProduct(id: string, data: Partial<BacklogProduct>): Promise<BacklogProduct> {
      return fetchApi(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteProduct(id: string): Promise<void> {
      return fetchApi(`/admin/products/${id}`, { method: "DELETE" });
    },
    // Areas
    listAreas(): Promise<BacklogProductArea[]> { return fetchApi("/admin/areas"); },
    createArea(data: Partial<BacklogProductArea>): Promise<BacklogProductArea> {
      return fetchApi("/admin/areas", { method: "POST", body: JSON.stringify(data) });
    },
    updateArea(id: string, data: Partial<BacklogProductArea>): Promise<BacklogProductArea> {
      return fetchApi(`/admin/areas/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteArea(id: string): Promise<void> {
      return fetchApi(`/admin/areas/${id}`, { method: "DELETE" });
    },
    // Statuses
    listStatuses(): Promise<BacklogStatus[]> { return fetchApi("/admin/statuses"); },
    createStatus(data: Partial<BacklogStatus>): Promise<BacklogStatus> {
      return fetchApi("/admin/statuses", { method: "POST", body: JSON.stringify(data) });
    },
    updateStatus(id: string, data: Partial<BacklogStatus>): Promise<BacklogStatus> {
      return fetchApi(`/admin/statuses/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteStatus(id: string): Promise<void> {
      return fetchApi(`/admin/statuses/${id}`, { method: "DELETE" });
    },
    // Sources
    listSources(): Promise<BacklogSource[]> { return fetchApi("/admin/sources"); },
    createSource(data: Partial<BacklogSource>): Promise<BacklogSource> {
      return fetchApi("/admin/sources", { method: "POST", body: JSON.stringify(data) });
    },
    updateSource(id: string, data: Partial<BacklogSource>): Promise<BacklogSource> {
      return fetchApi(`/admin/sources/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteSource(id: string): Promise<void> {
      return fetchApi(`/admin/sources/${id}`, { method: "DELETE" });
    },
    // Initiatives
    listInitiatives(): Promise<BacklogInitiative[]> { return fetchApi("/admin/initiatives"); },
    createInitiative(data: Partial<BacklogInitiative>): Promise<BacklogInitiative> {
      return fetchApi("/admin/initiatives", { method: "POST", body: JSON.stringify(data) });
    },
    updateInitiative(id: string, data: Partial<BacklogInitiative>): Promise<BacklogInitiative> {
      return fetchApi(`/admin/initiatives/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteInitiative(id: string): Promise<void> {
      return fetchApi(`/admin/initiatives/${id}`, { method: "DELETE" });
    },
    // Releases
    listReleases(): Promise<BacklogRelease[]> { return fetchApi("/admin/releases"); },
    createRelease(data: Partial<BacklogRelease>): Promise<BacklogRelease> {
      return fetchApi("/admin/releases", { method: "POST", body: JSON.stringify(data) });
    },
    updateRelease(id: string, data: Partial<BacklogRelease>): Promise<BacklogRelease> {
      return fetchApi(`/admin/releases/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    deleteRelease(id: string): Promise<void> {
      return fetchApi(`/admin/releases/${id}`, { method: "DELETE" });
    },
    // Config (discovery statuses, roadmap quarters)
    getConfig(): Promise<{ discoveryStatuses: string[]; roadmapQuarters: string[] }> {
      return fetchApi("/admin/config");
    },
    updateConfig(data: { discoveryStatuses?: string[]; roadmapQuarters?: string[] }): Promise<void> {
      return fetchApi("/admin/config", { method: "PUT", body: JSON.stringify(data) });
    },
    // Users
    listUsers(): Promise<AdminUser[]> { return fetchApi("/admin/users"); },
    updateUserRole(userId: string, role: string): Promise<AdminUser> {
      return fetchApi(`/admin/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) });
    },
  },
};

export interface JiraIssue {
  key: string;
  summary: string;
  description?: string;
  status?: string;
  priority?: string;
  issueType?: string;
  selected?: boolean;
}

export interface DuplicatePair {
  id: string;
  primary: BacklogItem;
  secondary: BacklogItem;
  similarity: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}
