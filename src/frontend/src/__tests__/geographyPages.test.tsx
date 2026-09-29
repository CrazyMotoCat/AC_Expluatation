import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { App } from "../app/App";
import { SessionContext } from "../app/providers/sessionContext";
import { SessionService, type SessionApi } from "../entities/session/SessionService";
import type { CurrentUser, WorkingContext } from "../entities/session/api";
import { geographyQueryKeys, regionsQuery, territorialZonesQuery, type Region, type TerritorialZone } from "../entities/geography/api";
import { geographyErrorMessage } from "../entities/geography/feedback";
import { siteQueryKeys } from "../entities/sites/api";
import { RegionsPage, TerritorialZonesPage } from "../pages/Geography/GeographyPages";
import { apiClient, createApiClient } from "../shared/api/client";
import type { OidcGateway } from "../shared/auth/oidc";

const zone: TerritorialZone = { id: "zone-a", code: "EAST", name: "Восток", status: "ACTIVE",
    createdAt: "2026-09-29T00:00:00Z", updatedAt: "2026-09-29T00:00:00Z", rowVersion: 1 };
const region: Region = { ...zone, id: "region-a", territorialZoneId: zone.id, code: "PRIM", name: "Приморье",
    timezone: "Asia/Vladivostok", status: "INACTIVE" };
const user: CurrentUser = { userId: "user-a", identityKey: { issuer: "test", subject: "a" },
    displayName: "Оператор", email: null, userType: "INTERNAL", status: "ACTIVE" };
const contextA: WorkingContext = { id: "context-a", contextType: "INTERNAL", contextEntityId: null,
    name: "Контекст А", validFrom: "2026-01-01T00:00:00Z", validTo: null };
const contextB = { ...contextA, id: "context-b", name: "Контекст Б" };
const clients: QueryClient[] = [];

// Static rendering has no external-store subscription; read the real service snapshot.
vi.mock("../app/providers/sessionContext", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../app/providers/sessionContext")>();
    const { useContext } = await import("react");
    return { ...actual, useSession: () => {
        const service = useContext(actual.SessionContext);
        if (!service) throw new Error("Missing test session");
        return { service, state: service.getState() };
    } };
});

function load(client: QueryClient, resource: string, contextId: string, filter = "") {
    if (resource === "zones") return client.fetchQuery({ ...territorialZonesQuery(user.userId, contextId), staleTime: 0 });
    return client.fetchQuery({ ...regionsQuery(user.userId, contextId, filter), staleTime: 0 });
}

async function fixture() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false, staleTime: 30_000 } } });
    clients.push(client);
    const gateway: OidcGateway = {
        getSession: async () => ({ accessToken: "test-token", expired: false }),
        completeLogin: async () => ({ accessToken: "test-token", expired: false }),
        renew: async () => null, completeSilent: async () => undefined, login: async () => undefined,
        logout: async () => undefined, clear: async () => undefined, onExpired: () => () => undefined,
    };
    const sessionApi: SessionApi = {
        currentUser: vi.fn().mockResolvedValue(user),
        contexts: async () => ({ contexts: [contextA, contextB], appliedContextId: null }),
        selectContext: async (id) => id === contextA.id ? contextA : contextB,
    };
    const storage = new Map<string, string>();
    const service = new SessionService(gateway, sessionApi, client, {
        getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => { storage.set(key, value); },
        removeItem: (key) => { storage.delete(key); },
    });
    await service.bootstrap(false);
    await service.selectContext(contextA.id);
    const keys = geographyQueryKeys(user.userId, contextA.id);
    const wrap = (element: ReactNode, url = "/geography/regions") => renderToStaticMarkup(
        <QueryClientProvider client={client}><SessionContext.Provider value={service}>
            <MemoryRouter initialEntries={[url]}>{element}</MemoryRouter>
        </SessionContext.Provider></QueryClientProvider>,
    );
    return { client, service, sessionApi, keys, wrap };
}

afterEach(() => { for (const client of clients.splice(0)) client.clear(); vi.restoreAllMocks(); });

describe("Geography read views in the current shell", () => {
    it.each([TerritorialZonesPage, RegionsPage])("shows the initial loading state", async (Page) => {
        const { wrap } = await fixture();
        expect(wrap(<Page />)).toContain("Загрузка данных");
    });

    it("renders backend Zone code/name/status without mutation controls", async () => {
        const { client, keys, wrap } = await fixture();
        client.setQueryData(keys.territorialZones, [zone, { ...zone, id: "inactive", code: "OLD", status: "INACTIVE" }]);
        const html = wrap(<TerritorialZonesPage />);
        for (const value of ["EAST", "Восток", "Активна", "Неактивна", "Обновить"]) expect(html).toContain(value);
        for (const value of ["Создать", "Изменить", "Активировать", "Деактивировать", "Удалить"]) expect(html).not.toContain(value);
    });

    it.each(["zones", "regions"])("renders a normal 200 [] empty state for %s", async (resource) => {
        const { client, keys, wrap } = await fixture();
        client.setQueryData(resource === "zones" ? keys.territorialZones : keys.regions(), []);
        expect(wrap(resource === "zones" ? <TerritorialZonesPage /> : <RegionsPage />)).toContain("Записей пока нет");
    });

    it("restores the exact URL filter and displays Region parent/timezone/status from backend data", async () => {
        const { client, keys, wrap } = await fixture();
        client.setQueryData(keys.territorialZones, [zone]);
        client.setQueryData(keys.regions(zone.id), [region]);
        const html = wrap(<RegionsPage />, `/geography/regions?territorialZoneId=${zone.id}`);
        for (const value of ["PRIM", "Приморье", "Восток", "Asia/Vladivostok", "Неактивен", 'value="zone-a" selected']) {
            expect(html).toContain(value);
        }
        expect(html).not.toContain("Создать");
    });

    it("uses a safe parent fallback for exact Region scope and never probes Zone detail", async () => {
        const { client, keys, wrap } = await fixture();
        const request = vi.spyOn(apiClient, "request");
        client.setQueryData(keys.territorialZones, []);
        client.setQueryData(keys.regions(), [region]);
        const html = wrap(<RegionsPage />);
        expect(html).toContain("Приморье");
        expect(html).toContain("Зона недоступна");
        expect(html).not.toContain(zone.id);
        expect(request).not.toHaveBeenCalled();
    });

    it("keeps Region rows usable while Zone enrichment is still loading", async () => {
        const { client, keys, wrap } = await fixture();
        client.setQueryData(keys.regions(), [region]);
        const html = wrap(<RegionsPage />);
        expect(html).toContain("Приморье");
        expect(html).toContain("Зона недоступна");
        expect(html).not.toContain("Загрузка данных");
    });

    it("keeps successful Regions and a clearable unknown URL filter when supplementary Zones fail", async () => {
        const { client, keys, wrap } = await fixture();
        await client.fetchQuery({ queryKey: keys.territorialZones, queryFn: async () => { throw { message: "secret hierarchy" }; } }).catch(() => undefined);
        client.setQueryData(keys.regions("hidden-parent"), [region]);
        const html = wrap(<RegionsPage />, "/geography/regions?territorialZoneId=hidden-parent");
        expect(html).toContain("Приморье");
        expect(html).toContain("Зона недоступна");
        expect(html).toContain("Повторить загрузку зон");
        expect(html).toContain('value="hidden-parent" selected');
        expect(html).not.toContain("secret hierarchy");
    });

    it.each(["zones", "regions"])("renders safe errors and retry for %s", async (resource) => {
        const { client, keys, wrap } = await fixture();
        await client.fetchQuery({ queryKey: resource === "zones" ? keys.territorialZones : keys.regions(),
            queryFn: async () => { throw { code: "GEOGRAPHY_ACCESS_DENIED", message: "token / stack / scope", details: "assignment-id" }; },
        }).catch(() => undefined);
        const html = wrap(resource === "zones" ? <TerritorialZonesPage /> : <RegionsPage />);
        expect(html).toContain("Географические данные недоступны");
        expect(html).toContain("Повторить");
        expect(html).not.toMatch(/token|stack|scope|assignment-id/);
    });

    it("Region failure leaves the independent Zone page usable", async () => {
        const { client, keys, wrap } = await fixture();
        client.setQueryData(keys.territorialZones, [zone]);
        await client.fetchQuery({ queryKey: keys.regions(), queryFn: async () => { throw new Error("database internals"); } }).catch(() => undefined);
        expect(wrap(<RegionsPage />)).toContain("Не удалось загрузить регионы");
        expect(wrap(<TerritorialZonesPage />)).toContain("Восток");
    });

    it.each(["/geography/territorial-zones", "/geography/regions", "/sites", "/sites/new"])("preserves navigation/session controls and routes %s", async (url) => {
        const { wrap } = await fixture();
        const html = wrap(<App />, url);
        for (const value of ['href="/geography/territorial-zones"', 'href="/geography/regions"', 'href="/sites"', "Рабочий контекст", "Выйти"]) {
            expect(html).toContain(value);
        }
        expect(html).not.toContain("Страница не найдена");
    });

    it("does not turn legacy not-found codes or backend messages into existence disclosure", () => {
        expect(geographyErrorMessage({ code: "REGION_NOT_FOUND", message: "missing id" }, "Не удалось загрузить регионы."))
            .toBe("Не удалось загрузить регионы.");
        expect(geographyErrorMessage({ code: "GEOGRAPHY_ACCESS_DENIED", message: "exists but unauthorized" }, "fallback"))
            .toBe("Географические данные недоступны.");
    });
});

describe("Canonical session isolation for Geography", () => {
    it.each(["zones", "regions"])("clears A %s, loads B through B headers, and renders only B data", async (resource) => {
        const { client, service, wrap } = await fixture();
        const fetchImplementation = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
            const context = new Headers(init?.headers).get("X-Work-Context-Id");
            return new Response(JSON.stringify(resource === "zones"
                ? [{ ...zone, name: `Zone ${context}` }] : [{ ...region, name: `Region ${context}` }]));
        });
        vi.spyOn(apiClient, "request").mockImplementation(createApiClient({ baseUrl: "/api/v1", auth: service, fetchImplementation }).request);
        await load(client, resource, contextA.id, "zone-filter");
        const render = () => wrap(resource === "zones" ? <TerritorialZonesPage /> : <RegionsPage />,
            "/geography/regions?territorialZoneId=zone-filter");
        expect(render()).toContain(`context-a`);
        await service.selectContext(contextB.id);
        expect(render()).not.toContain(resource === "zones" ? "Zone context-a" : "Region context-a");
        await load(client, resource, contextB.id, "zone-filter");
        expect(render()).toContain(resource === "zones" ? "Zone context-b" : "Region context-b");
        expect(render()).not.toContain(resource === "zones" ? "Zone context-a" : "Region context-a");
        expect(new Headers(fetchImplementation.mock.calls.at(-1)?.[1]?.headers).get("X-Work-Context-Id")).toBe(contextB.id);
        if (resource === "regions") expect(fetchImplementation.mock.calls.at(-1)?.[0]).toBe("/api/v1/regions?territorialZoneId=zone-filter");
    });

    it.each(["zones", "regions"])("rejects a late A %s response after context switch, with abort wired to transport", async (resource) => {
        const { client, service, wrap } = await fixture();
        let finish!: (response: Response) => void;
        const fetchImplementation = vi.fn<typeof fetch>().mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
        vi.spyOn(apiClient, "request").mockImplementation(createApiClient({ baseUrl: "/api/v1", auth: service, fetchImplementation }).request);
        const keys = geographyQueryKeys(user.userId, contextA.id);
        const key = resource === "zones" ? keys.territorialZones : keys.regions();
        const pending = load(client, resource, contextA.id).catch(() => undefined);
        await vi.waitFor(() => expect(fetchImplementation).toHaveBeenCalledOnce());
        await service.selectContext(contextB.id);
        expect(fetchImplementation.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
        finish(new Response(JSON.stringify(resource === "zones" ? [zone] : [region])));
        await pending;
        await Promise.resolve();
        expect(client.getQueryData(key)).toBeUndefined();
        const html = wrap(resource === "zones" ? <TerritorialZonesPage /> : <RegionsPage />);
        expect(html).not.toContain(resource === "zones" ? "Восток" : "Приморье");
    });

    it.each(["zones", "regions"])("late %s after logout cannot populate a new same-user/context session", async (resource) => {
        const { client, service, keys, wrap } = await fixture();
        client.setQueryData(keys.territorialZones, [zone]);
        client.setQueryData(keys.regions(), [region]);
        let finish!: (response: Response) => void;
        const fetchImplementation = vi.fn<typeof fetch>().mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
        vi.spyOn(apiClient, "request").mockImplementation(createApiClient({ baseUrl: "/api/v1", auth: service, fetchImplementation }).request);
        const key = resource === "zones" ? keys.territorialZones : keys.regions();
        const pending = load(client, resource, contextA.id).catch(() => undefined);
        await vi.waitFor(() => expect(fetchImplementation).toHaveBeenCalledOnce());
        const generation = service.getSessionGeneration();
        await service.logout();
        expect(client.getQueryCache().getAll()).toHaveLength(0);
        expect(fetchImplementation.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
        await service.bootstrap(false);
        await service.selectContext(contextA.id);
        expect(service.getSessionGeneration()).not.toBe(generation);
        finish(new Response(JSON.stringify(resource === "zones" ? [zone] : [region])));
        await pending;
        await Promise.resolve();
        expect(client.getQueryData(key)).toBeUndefined();
        const html = wrap(resource === "zones" ? <TerritorialZonesPage /> : <RegionsPage />);
        expect(html).not.toContain(resource === "zones" ? "Восток" : "Приморье");
    });

    it("new user cannot see earlier Geography or Site-selector data", async () => {
        const { client, service, sessionApi, keys, wrap } = await fixture();
        client.setQueryData(keys.territorialZones, [zone]);
        client.setQueryData(keys.regions(), [region]);
        expect(client.getQueryData(siteQueryKeys(user.userId, contextA.id).regions)).toEqual([region]);
        await service.logout();
        vi.mocked(sessionApi.currentUser).mockResolvedValue({ ...user, userId: "user-b" });
        await service.bootstrap(false);
        await service.selectContext(contextA.id);
        expect(wrap(<RegionsPage />)).not.toContain("Приморье");
        expect(wrap(<TerritorialZonesPage />)).not.toContain("Восток");
        expect(client.getQueryData(siteQueryKeys("user-b", contextA.id).regions)).toBeUndefined();
    });

    it("refresh and retry refetch the current protected query through its loader", async () => {
        const { client } = await fixture();
        const request = vi.spyOn(apiClient, "request").mockRejectedValueOnce({ message: "internal" }).mockResolvedValue([zone] as never);
        const observer = new QueryObserver(client, territorialZonesQuery(user.userId, contextA.id));
        const unsubscribe = observer.subscribe(() => undefined);
        await vi.waitFor(() => expect(observer.getCurrentResult().isError).toBe(true));
        await observer.refetch();
        expect(observer.getCurrentResult().data).toEqual([zone]);
        await observer.refetch();
        expect(request).toHaveBeenCalledTimes(3);
        expect(request.mock.calls.every(([path, init]) => path === "/territorial-zones" && init?.signal instanceof AbortSignal)).toBe(true);
        unsubscribe();
    });
});
