import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { SiteForm } from "../pages/SitesPage/SiteForm";
import { SiteDetailPage } from "../pages/SitesPage/SiteDetailPage";
import { SitesPage } from "../pages/SitesPage/SitesPage";
import { siteQueryKeys, type Region, type Site, type SitePage, type SiteReference } from "../entities/sites/api";

const currentSession = vi.hoisted(() => ({ userId: "user-1", contextId: "context-a" }));

vi.mock("../app/providers/sessionContext", () => ({
    useSession: () => ({ state: { status: "authenticated", user: { userId: currentSession.userId }, contexts: [], contextId: currentSession.contextId, error: null } }),
}));

const site: Site = {
    id: "site-1", code: "SITE-1", name: "Узел связи", regionId: "region-1", siteTypeId: "type-inactive",
    criticalityClassId: "criticality-1", address: "ул. Примерная, 1", timezone: "Asia/Vladivostok", status: "ACTIVE", rowVersion: 4,
};
const regions: Region[] = [{ id: "region-1", code: "R-1", name: "Приморский регион", status: "ACTIVE",
    territorialZoneId: "zone-1", timezone: "Asia/Vladivostok", createdAt: "2026-09-29T00:00:00Z",
    updatedAt: "2026-09-29T00:00:00Z", rowVersion: 1 }];
const types: SiteReference[] = [
    { id: "type-active", code: "A", name: "Подстанция", status: "ACTIVE" },
    { id: "type-inactive", code: "I", name: "Существующий тип", status: "INACTIVE" },
];
const criticalities: SiteReference[] = [
    { id: "criticality-1", code: "C1", name: "Повышенная", status: "ACTIVE" },
    { id: "criticality-inactive", code: "C0", name: "Архивная", status: "INACTIVE" },
];

function fixture() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const keys = siteQueryKeys(currentSession.userId, currentSession.contextId);
    client.setQueryData(keys.regions, regions);
    client.setQueryData(keys.siteTypes, types);
    client.setQueryData(keys.criticalities, criticalities);
    return { client, keys, wrap: (element: ReactNode, path = "/") => renderToStaticMarkup(
        <MemoryRouter initialEntries={[path]}><QueryClientProvider client={client}>{element}</QueryClientProvider></MemoryRouter>,
    ) };
}

describe("Site management pages", () => {
    beforeEach(() => {
        currentSession.userId = "user-1";
        currentSession.contextId = "context-a";
    });

    it("renders backend-driven list labels, status and server pagination metadata", () => {
        const { client, keys, wrap } = fixture();
        const filters = { q: "", regionId: "", siteTypeId: "", criticalityClassId: "", status: "", page: 1, pageSize: 50 };
        client.setQueryData(keys.list(filters), { items: [site], page: 1, pageSize: 50, totalCount: 1, totalPages: 3 } satisfies SitePage);
        const html = wrap(<SitesPage />);

        expect(html).toContain("Узел связи");
        expect(html).toContain("Приморский регион");
        expect(html).toContain("Существующий тип");
        expect(html).toContain("Повышенная");
        expect(html).toContain("Asia/Vladivostok");
        expect(html).toContain("Страница 1 из 3");
    });

    it("renders an ordinary empty state for an empty authorized page", () => {
        const { client, keys, wrap } = fixture();
        const filters = { q: "", regionId: "", siteTypeId: "", criticalityClassId: "", status: "", page: 1, pageSize: 50 };
        client.setQueryData(keys.list(filters), { items: [], page: 1, pageSize: 50, totalCount: 0, totalPages: 0 } satisfies SitePage);
        expect(wrap(<SitesPage />)).toContain("Объекты не найдены");
    });

    it("renders Site core fields with backend-driven labels and preserves existing actions", () => {
        const { client, keys, wrap } = fixture();
        client.setQueryData(keys.detail(site.id), site);
        const html = wrap(<Routes><Route path="/sites/:siteId" element={<SiteDetailPage />} /></Routes>, "/sites/site-1");
        expect(html).toContain("Узел связи");
        expect(html).toContain("Приморский регион");
        expect(html).toContain("Существующий тип (неактивен)");
        expect(html).toContain("Повышенная");
        expect(html).toContain("ул. Примерная, 1");
        expect(html).toContain("Asia/Vladivostok");
        expect(html).toContain("Активен");
        expect(html).toContain("Изменить критичность");
        expect(html).toContain("Редактировать");
        expect(html).toContain("Деактивировать");
    });

    it("renders future sections as explicit availability placeholders without business values", () => {
        const { client, keys, wrap } = fixture();
        client.setQueryData(keys.detail(site.id), site);
        const html = wrap(<Routes><Route path="/sites/:siteId" element={<SiteDetailPage />} /></Routes>, "/sites/site-1");

        expect(html).toContain("Общая информация");
        expect(html).toContain("Критичность");
        expect(html).toContain("Локации");
        expect(html).toContain("Раздел будет доступен после настройки локаций.");
        expect(html).toContain("Сводка по оборудованию");
        expect(html).toContain("после подключения реестра активов");
        expect(html).toContain("Ответственные направления");
        expect(html).toContain("после настройки ответственных направлений");
        expect(html).not.toMatch(/\b0\s*(локац|объект|единиц|активн)/i);
        expect(html).not.toContain("Локации не найдены");
        expect(html).not.toContain("Оборудование не найдено");
    });

    it("does not show a Site cached for context A as the current detail in context B", () => {
        const { client, keys: contextAKeys, wrap } = fixture();
        client.setQueryData(contextAKeys.detail(site.id), site);

        const contextBKeys = siteQueryKeys("user-1", "context-b");
        client.setQueryData(contextBKeys.regions, regions);
        client.setQueryData(contextBKeys.siteTypes, types);
        client.setQueryData(contextBKeys.criticalities, criticalities);
        client.setQueryData(contextBKeys.detail(site.id), { ...site, name: "Объект контекста Б" });
        currentSession.contextId = "context-b";

        const html = wrap(<Routes><Route path="/sites/:siteId" element={<SiteDetailPage />} /></Routes>, "/sites/site-1");
        expect(html).toContain("Объект контекста Б");
        expect(html).not.toContain("Узел связи");
    });

    it("offers active choices for new assignment and retains an inactive current SiteType during edit", () => {
        const { wrap } = fixture();
        const createHtml = wrap(<SiteForm />);
        expect(createHtml).toContain("Подстанция");
        expect(createHtml).not.toContain("Существующий тип");
        expect(createHtml).not.toContain("Архивная");

        const editHtml = wrap(<SiteForm site={site} />);
        expect(editHtml).toContain("Существующий тип (неактивен, текущее значение)");
        expect(editHtml).toContain("Код объекта");
        expect(editHtml).toContain("Регион");
        expect(editHtml).not.toContain("Критичность<select");
    });
});
