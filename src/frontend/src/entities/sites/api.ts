import { apiClient } from "../../shared/api/client";

export interface Site {
    id: string;
    code: string;
    name: string;
    regionId: string;
    siteTypeId: string;
    criticalityClassId: string;
    address: string;
    timezone: string;
    status: "ACTIVE" | "INACTIVE";
    rowVersion: number;
}

export interface SitePage {
    items: Site[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface SiteFilters {
    q: string;
    regionId: string;
    siteTypeId: string;
    criticalityClassId: string;
    status: string;
    page: number;
    pageSize: number;
}

export interface Region {
    id: string;
    code: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
}

export interface SiteReference {
    id: string;
    code: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
}

export interface CreateSiteRequest {
    regionId: string;
    siteTypeId: string;
    criticalityClassId: string;
    code: string;
    name: string;
    address: string;
    timezone: string;
}

export interface UpdateSiteRequest {
    name: string;
    siteTypeId: string;
    address: string;
    timezone: string;
    expectedRowVersion: number;
}

export interface ChangeCriticalityRequest {
    criticalityClassId: string;
    expectedRowVersion: number;
}

export interface LifecycleRequest {
    expectedRowVersion: number;
}

function queryString(filters: SiteFilters) {
    const params = new URLSearchParams();
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.regionId) params.set("regionId", filters.regionId);
    if (filters.siteTypeId) params.set("siteTypeId", filters.siteTypeId);
    if (filters.criticalityClassId) params.set("criticalityClassId", filters.criticalityClassId);
    if (filters.status) params.set("status", filters.status);
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));
    return params.toString();
}

export const siteApi = {
    list(filters: SiteFilters, signal?: AbortSignal) {
        return apiClient.request<SitePage>(`/api/v1/sites?${queryString(filters)}`, { signal });
    },
    get(siteId: string, signal?: AbortSignal) {
        return apiClient.request<Site>(`/api/v1/sites/${encodeURIComponent(siteId)}`, { signal });
    },
    regions(signal?: AbortSignal) {
        return apiClient.request<Region[]>("/api/v1/regions", { signal });
    },
    siteTypes(signal?: AbortSignal) {
        return apiClient.request<SiteReference[]>("/api/v1/reference/site-types", { signal });
    },
    criticalities(signal?: AbortSignal) {
        return apiClient.request<SiteReference[]>("/api/v1/reference/site-criticality-classes", { signal });
    },
    create(request: CreateSiteRequest) {
        return apiClient.request<Site>("/api/v1/sites", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
        });
    },
    update(siteId: string, request: UpdateSiteRequest) {
        return apiClient.request<Site>(`/api/v1/sites/${encodeURIComponent(siteId)}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
        });
    },
    activate(siteId: string, request: LifecycleRequest) {
        return apiClient.request<Site>(`/api/v1/sites/${encodeURIComponent(siteId)}/activate`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
        });
    },
    deactivate(siteId: string, request: LifecycleRequest) {
        return apiClient.request<Site>(`/api/v1/sites/${encodeURIComponent(siteId)}/deactivate`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
        });
    },
    changeCriticality(siteId: string, request: ChangeCriticalityRequest) {
        return apiClient.request<Site>(`/api/v1/sites/${encodeURIComponent(siteId)}/criticality`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
        });
    },
};

export function siteQueryKeys(userId: string | null, contextId: string | null) {
    const sessionContext = [userId, contextId] as const;
    return {
        sessionContext,
        lists: ["sites", ...sessionContext, "list"] as const,
        list: (filters: SiteFilters) => ["sites", ...sessionContext, "list", filters] as const,
        detail: (siteId: string) => ["sites", ...sessionContext, "detail", siteId] as const,
        regions: ["sites", ...sessionContext, "regions"] as const,
        siteTypes: ["sites", ...sessionContext, "site-types"] as const,
        criticalities: ["sites", ...sessionContext, "criticalities"] as const,
    };
}

export function changeSiteFilter<K extends Exclude<keyof SiteFilters, "page" | "pageSize">>(
    filters: SiteFilters,
    key: K,
    value: SiteFilters[K],
): SiteFilters {
    return { ...filters, [key]: value, page: 1 };
}

export function siteErrorMessage(error: unknown, fallback = "Не удалось выполнить операцию с объектом.") {
    const code = typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "GEOGRAPHY_ACCESS_DENIED") return "Объект или операция недоступны.";
    if (code === "OPTIMISTIC_CONCURRENCY_CONFLICT") return "Объект изменился. Проверьте актуальное состояние перед повторной отправкой.";
    if (code === "SITE_CODE_ALREADY_EXISTS") return "Объект с таким кодом уже существует.";
    if (code === "SITE_TYPE_NOT_FOUND" || code === "SITE_CRITICALITY_CLASS_NOT_FOUND" || code === "REGION_NOT_FOUND") {
        return "Выбранное значение справочника недоступно. Обновите справочные данные.";
    }
    if (code.endsWith("_STATE_CONFLICT")) return "Операция недоступна для текущего состояния объекта или справочника.";
    if (code === "VALIDATION_FAILED") return "Проверьте введённые значения.";
    return fallback;
}

export function siteReferenceLabel(items: SiteReference[], id: string) {
    return items.find((item) => item.id === id)?.name ?? "Значение справочника недоступно";
}

export function activeReferences(items: SiteReference[], currentId?: string) {
    return items.filter((item) => item.status === "ACTIVE" || item.id === currentId);
}
