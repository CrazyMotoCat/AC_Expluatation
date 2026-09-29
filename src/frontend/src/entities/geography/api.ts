import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "../../shared/api/client";

export interface TerritorialZone {
    id: string;
    code: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    updatedAt: string;
    rowVersion: number;
}

export interface Region extends TerritorialZone {
    territorialZoneId: string;
    timezone: string;
}

export const geographyApi = {
    territorialZones(signal?: AbortSignal) {
        return apiClient.request<TerritorialZone[]>("/territorial-zones", { signal });
    },
    regions(territorialZoneId = "", signal?: AbortSignal) {
        const params = new URLSearchParams();
        if (territorialZoneId) params.set("territorialZoneId", territorialZoneId);
        const query = params.size ? `?${params}` : "";
        return apiClient.request<Region[]>(`/regions${query}`, { signal });
    },
};

export function geographyQueryKeys(userId: string | null, contextId: string | null) {
    return {
        territorialZones: ["geography", userId, contextId, "territorial-zones"] as const,
        regions: (territorialZoneId = "") => ["geography", userId, contextId, "regions", territorialZoneId] as const,
    };
}

export function territorialZonesQuery(userId: string | null, contextId: string | null) {
    return queryOptions({
        queryKey: geographyQueryKeys(userId, contextId).territorialZones,
        queryFn: ({ signal }) => geographyApi.territorialZones(signal),
    });
}

export function regionsQuery(userId: string | null, contextId: string | null, territorialZoneId = "") {
    return queryOptions({
        queryKey: geographyQueryKeys(userId, contextId).regions(territorialZoneId),
        queryFn: ({ signal }) => geographyApi.regions(territorialZoneId, signal),
    });
}
