import { geographyApi, geographyQueryKeys, regionsQuery, territorialZonesQuery } from "../../../src/frontend/src/entities/geography/api";
import { siteApi, siteQueryKeys } from "../../../src/frontend/src/entities/sites/api";
import { apiClient, createApiClient } from "../../../src/frontend/src/shared/api/client";
import { environment } from "../../../src/frontend/src/shared/config/environment";
import { createQueryClient } from "../../../src/frontend/src/app/providers/queryClient";

describe("Geography final transport contract", () => {
    afterEach(() => vi.restoreAllMocks());

    function transport() {
        const fetchImplementation = vi.fn<typeof fetch>().mockImplementation(async () => new Response("[]"));
        const client = createApiClient({ baseUrl: environment.apiBaseUrl, fetchImplementation, auth: {
            getAccessToken: async () => "test-token", getContextId: () => "context-a", onUnauthorized: async () => undefined,
        } });
        vi.spyOn(apiClient, "request").mockImplementation(client.request);
        return fetchImplementation;
    }

    it("reaches published Zone and Region endpoints with exactly one API prefix, auth and cancellation", async () => {
        const fetchImplementation = transport();
        const controller = new AbortController();
        await geographyApi.territorialZones(controller.signal);
        await geographyApi.regions("zone & one", controller.signal);
        await siteApi.regions(controller.signal);
        expect(fetchImplementation.mock.calls.map(([url]) => url)).toEqual([
            "/api/v1/territorial-zones", "/api/v1/regions?territorialZoneId=zone+%26+one", "/api/v1/regions",
        ]);
        for (const [url, init] of fetchImplementation.mock.calls) {
            expect(String(url).match(/\/api\/v1/g)).toHaveLength(1);
            expect(init?.signal).toBe(controller.signal);
            expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-token");
            expect(new Headers(init?.headers).get("X-Work-Context-Id")).toBe("context-a");
        }
    });

    it("corrects Site resource paths without changing shared base URL semantics", async () => {
        const fetchImplementation = transport();
        await siteApi.list({ q: "", regionId: "", siteTypeId: "", criticalityClassId: "", status: "", page: 1, pageSize: 50 });
        await siteApi.get("site-1");
        await siteApi.siteTypes();
        await siteApi.criticalities();
        await siteApi.create({ regionId: "r", siteTypeId: "t", criticalityClassId: "c", code: "S", name: "Site", address: "Address", timezone: "UTC" });
        await siteApi.update("site-1", { name: "Site", siteTypeId: "t", address: "Address", timezone: "UTC", expectedRowVersion: 1 });
        await siteApi.activate("site-1", { expectedRowVersion: 1 });
        await siteApi.deactivate("site-1", { expectedRowVersion: 1 });
        await siteApi.changeCriticality("site-1", { criticalityClassId: "c", expectedRowVersion: 1 });
        expect(fetchImplementation.mock.calls.map(([url]) => url)).toEqual([
            "/api/v1/sites?page=1&pageSize=50", "/api/v1/sites/site-1", "/api/v1/reference/site-types",
            "/api/v1/reference/site-criticality-classes", "/api/v1/sites", "/api/v1/sites/site-1",
            "/api/v1/sites/site-1/activate", "/api/v1/sites/site-1/deactivate", "/api/v1/sites/site-1/criticality",
        ]);
    });

    it("shares only the unfiltered Region cache with Site selectors and distinguishes resource/user/context/filter", () => {
        const keys = geographyQueryKeys("user-a", "context-a");
        expect(keys.regions()).toEqual(siteQueryKeys("user-a", "context-a").regions);
        expect(keys.regions("zone-a")).not.toEqual(siteQueryKeys("user-a", "context-a").regions);
        expect(keys.regions("zone-a")).not.toEqual(keys.regions("zone-b"));
        expect(keys.regions()).not.toEqual(keys.territorialZones);
        expect(keys.regions()).not.toEqual(geographyQueryKeys("user-b", "context-a").regions());
        expect(keys.territorialZones).not.toEqual(geographyQueryKeys("user-a", "context-b").territorialZones);
    });

    it("query functions forward the query signal and exact business filter to the common loader", async () => {
        const fetchImplementation = transport();
        const signal = new AbortController().signal;
        const client = createQueryClient();
        const zoneOptions = territorialZonesQuery("u", "c");
        const regionOptions = regionsQuery("u", "c", "zone-a");
        await zoneOptions.queryFn!({ client, queryKey: zoneOptions.queryKey, signal, meta: undefined });
        await regionOptions.queryFn!({ client, queryKey: regionOptions.queryKey, signal, meta: undefined });
        expect(fetchImplementation.mock.calls[1]?.[0]).toBe("/api/v1/regions?territorialZoneId=zone-a");
        expect(fetchImplementation.mock.calls.every(([, init]) => init?.signal === signal)).toBe(true);
        client.clear();
    });
});
