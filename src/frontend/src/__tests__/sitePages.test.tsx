import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { SiteForm } from "../pages/SitesPage/SiteForm";
import { SiteDetailPage } from "../pages/SitesPage/SiteDetailPage";
import { SitesPage } from "../pages/SitesPage/SitesPage";
import { siteQueryKeys, type Region, type Site, type SitePage, type SiteReference } from "../entities/sites/api";

vi.mock("../app/providers/sessionContext", () => ({
    useSession: () => ({ state: { status: "authenticated", user: { userId: "user-1" }, contexts: [], contextId: "context-a", error: null } }),
}));

const site: Site = {
    id: "site-1", code: "SITE-1", name: "Узел связи", regionId: "region-1", siteTypeId: "type-inactive",
    criticalityClassId: "criticality-1", address: "ул. Примерная, 1", timezone: "Asia/Vladivostok", status: "ACTIVE", rowVersion: 4,
};
const regions: Region[] = [{ id: "region-1", code: "R-1", name: "Приморский регион", status: "ACTIVE" }];
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
    const keys = siteQueryKeys("user-1", "context-a");
    client.setQueryData(keys.regions, regions);
    client.setQueryData(keys.siteTypes, types);
    client.setQueryData(keys.criticalities, criticalities);
    return { client, keys, wrap: (element: ReactNode, path = "/") => renderToStaticMarkup(
        <MemoryRouter initialEntries={[path]}><QueryClientProvider client={client}>{element}</QueryClientProvider></MemoryRouter>,
    ) };
}

describe("Site management pages", () => {
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

    it("renders detail with current inactive references and separate management actions", () => {
        const { client, keys, wrap } = fixture();
        client.setQueryData(keys.detail(site.id), site);
        const html = wrap(<Routes><Route path="/sites/:siteId" element={<SiteDetailPage />} /></Routes>, "/sites/site-1");
        expect(html).toContain("Узел связи");
        expect(html).toContain("Приморский регион");
        expect(html).toContain("Существующий тип (неактивен)");
        expect(html).toContain("Изменить критичность");
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
