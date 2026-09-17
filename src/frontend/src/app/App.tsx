import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage/NotFoundPage";
import { SystemPage } from "../pages/SystemPage/SystemPage";
import { AppLayout } from "./layout/AppLayout";

export function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="system" element={<SystemPage />} />
                <Route path="home" element={<Navigate replace to="/" />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}
