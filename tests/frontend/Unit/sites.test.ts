import {
    activeReferences, changeSiteFilter, isActiveRegionSelection, siteApi, siteErrorMessage, siteQueryKeys, siteReferenceLabel,
    type SiteFilters,
} from "../../../src/frontend/src/entities/sites/api";
import { apiClient } from "../../../src/frontend/src/shared/api/client";

const filters: SiteFilters = {
    q: "  Станция  ", regionId: "region-1", siteTypeId: "type-1", criticalityClassId: "criticality-1",
    status: "ACTIVE", page: 2, pageSize: 50,
};

describe("Site API and protected query contracts", () => {
    afterEach(() => vi.restoreAllMocks());

    it("maps list filters to backend query parameters and forwards cancellation", async () => {
        const request = vi.spyOn(apiClient, "request").mockResolvedValue({
            items: [], page: 2, pageSize: 50, totalCount: 52, totalPages: 2,
        } as never);
        const controller = new AbortController();
        const page = await siteApi.list(filters, controller.signal);

        expect(page.totalCount).toBe(52);
        const [path, init] = request.mock.calls[0] ?? [];
        const url = new URL(path ?? "", "https://app.example.test");
        expect(url.pathname).toBe("/sites");
        expect(Object.fromEntries(url.searchParams)).toEqual({
            q: "Станция", regionId: "region-1", siteTypeId: "type-1", criticalityClassId: "criticality-1",
            status: "ACTIVE", page: "2", pageSize: "50",
        });
        expect(init?.signal).toBe(controller.signal);
    });

    it("uses exact mutation routes and sends only the published request fields", async () => {
        const response = { id: "site-1", rowVersion: 8 };
        const request = vi.spyOn(apiClient, "request").mockResolvedValue(response as never);

        await siteApi.create({ regionId: "r", siteTypeId: "t", criticalityClassId: "c", code: "S-1",
            name: "Станция", address: "Улица", timezone: "Asia/Vladivostok" });
        await siteApi.update("site-1", { name: "Новое имя", siteTypeId: "t", address: "Улица", timezone: "UTC", expectedRowVersion: 7 });
        await siteApi.activate("site-1", { expectedRowVersion: 8 });
        await siteApi.deactivate("site-1", { expectedRowVersion: 9 });
        await siteApi.changeCriticality("site-1", { criticalityClassId: "c2", expectedRowVersion: 10 });

        expect(request.mock.calls.map(([url, init]) => [String(url), init?.method])).toEqual([
            ["/sites", "POST"], ["/sites/site-1", "PUT"],
            ["/sites/site-1/activate", "POST"], ["/sites/site-1/deactivate", "POST"],
            ["/sites/site-1/criticality", "PUT"],
        ]);
        expect(JSON.parse(String(request.mock.calls[0]?.[1]?.body))).toEqual({
            regionId: "r", siteTypeId: "t", criticalityClassId: "c", code: "S-1", name: "Станция", address: "Улица", timezone: "Asia/Vladivostok",
        });
        expect(JSON.parse(String(request.mock.calls[1]?.[1]?.body))).toEqual({
            name: "Новое имя", siteTypeId: "t", address: "Улица", timezone: "UTC", expectedRowVersion: 7,
        });
        expect(JSON.parse(String(request.mock.calls[4]?.[1]?.body))).toEqual({ criticalityClassId: "c2", expectedRowVersion: 10 });
    });

    it("isolates protected query data by user and working context", () => {
        const contextA = siteQueryKeys("user-1", "context-a");
        const contextB = siteQueryKeys("user-1", "context-b");
        const otherUser = siteQueryKeys("user-2", "context-a");
        expect(contextA.list(filters)).not.toEqual(contextB.list(filters));
        expect(contextA.detail("site-1")).not.toEqual(otherUser.detail("site-1"));
        expect(contextA.regions).not.toEqual(contextB.regions);
        expect(contextA.siteTypes).not.toEqual(contextB.siteTypes);
        expect(contextA.criticalities).not.toEqual(contextB.criticalities);
    });

    it("resets the server page when a list filter changes", () => {
        expect(changeSiteFilter(filters, "regionId", "region-2")).toEqual({ ...filters, regionId: "region-2", page: 1 });
        expect(changeSiteFilter(filters, "q", "новый поиск").page).toBe(1);
    });

    it("displays inactive current references while excluding them from new choices", () => {
        const references = [
            { id: "active", code: "A", name: "Активный тип", status: "ACTIVE" as const },
            { id: "inactive", code: "I", name: "Исторический тип", status: "INACTIVE" as const },
        ];
        expect(siteReferenceLabel(references, "inactive")).toBe("Исторический тип");
        expect(activeReferences(references).map((item) => item.id)).toEqual(["active"]);
        expect(activeReferences(references, "inactive").map((item) => item.id)).toEqual(["active", "inactive"]);
    });

    it("requires a selected Region to be active in the current context data", () => {
        const regions = [
            { id: "active", code: "A", name: "Текущий регион", status: "ACTIVE" as const },
            { id: "inactive", code: "I", name: "Неактивный регион", status: "INACTIVE" as const },
        ];
        expect(isActiveRegionSelection(regions, "active")).toBe(true);
        expect(isActiveRegionSelection(regions, "inactive")).toBe(false);
        expect(isActiveRegionSelection(regions, "region-from-old-context")).toBe(false);
    });

    it("maps concealment and conflict errors to safe UX without exposing API messages", () => {
        expect(siteErrorMessage({ code: "GEOGRAPHY_ACCESS_DENIED", message: "scope=secret" })).toBe("Объект или операция недоступны.");
        expect(siteErrorMessage({ code: "OPTIMISTIC_CONCURRENCY_CONFLICT", message: "internal body" })).toContain("изменился");
        expect(siteErrorMessage({ code: "SITE_CODE_ALREADY_EXISTS", message: "constraint sites_code" })).toContain("таким кодом уже существует");
        expect(siteErrorMessage({ code: "UNKNOWN", message: "stack trace" })).toBe("Не удалось выполнить операцию с объектом.");
    });
});
