import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage/NotFoundPage";
import { SystemPage } from "../pages/SystemPage/SystemPage";
import { SiteCreatePage } from "../pages/SitesPage/SiteCreatePage";
import { SiteDetailPage } from "../pages/SitesPage/SiteDetailPage";
import { SitesPage } from "../pages/SitesPage/SitesPage";
import { RegionsPage, TerritorialZonesPage } from "../pages/Geography/GeographyPages";
import { AppLayout } from "./layout/AppLayout";

export function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="system" element={<SystemPage />} />
                <Route path="sites" element={<SitesPage />} />
                <Route path="sites/new" element={<SiteCreatePage />} />
                <Route path="sites/:siteId" element={<SiteDetailPage />} />
                <Route path="geography/territorial-zones" element={<TerritorialZonesPage />} />
                <Route path="geography/regions" element={<RegionsPage />} />
                <Route path="home" element={<Navigate replace to="/" />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}
