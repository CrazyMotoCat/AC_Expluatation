import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useSession } from "../../app/providers/sessionContext";
import { changeSiteFilter, siteApi, siteErrorMessage, siteQueryKeys, type SiteFilters } from "../../entities/sites/api";
import styles from "./SitesPage.module.css";

const initialFilters: SiteFilters = { q: "", regionId: "", siteTypeId: "", criticalityClassId: "", status: "", page: 1, pageSize: 50 };

export function SitesPage() {
    const { state } = useSession();
    const [filters, setFilters] = useState(initialFilters);
    const keys = siteQueryKeys(state.user?.userId ?? null, state.contextId);
    const sitesQuery = useQuery({ queryKey: keys.list(filters), queryFn: ({ signal }) => siteApi.list(filters, signal) });
    const regionsQuery = useQuery({ queryKey: keys.regions, queryFn: ({ signal }) => siteApi.regions(signal) });
    const typesQuery = useQuery({ queryKey: keys.siteTypes, queryFn: ({ signal }) => siteApi.siteTypes(signal) });
    const criticalitiesQuery = useQuery({ queryKey: keys.criticalities, queryFn: ({ signal }) => siteApi.criticalities(signal) });

    function changeFilter<K extends Exclude<keyof SiteFilters, "page" | "pageSize">>(key: K, value: SiteFilters[K]) {
        setFilters((current) => changeSiteFilter(current, key, value));
    }

    return <section className={styles.page}>
        <div className={styles.pageHeading}>
            <div><p className={styles.eyebrow}>Реестр</p><h1>Объекты</h1><p>Список объектов в выбранном рабочем контексте.</p></div>
            <Link className={styles.primaryLink} to="/sites/new">Создать объект</Link>
        </div>
        <div className={styles.filters} aria-label="Фильтры объектов">
            <label>Поиск<input type="search" value={filters.q} onChange={(event) => changeFilter("q", event.target.value)} placeholder="Код или название" /></label>
            <label>Регион<select value={filters.regionId} onChange={(event) => changeFilter("regionId", event.target.value)}>
                <option value="">Все регионы</option>{(regionsQuery.data ?? []).map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
            </select></label>
            <label>Тип объекта<select value={filters.siteTypeId} onChange={(event) => changeFilter("siteTypeId", event.target.value)}>
                <option value="">Все типы</option>{(typesQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select></label>
            <label>Критичность<select value={filters.criticalityClassId} onChange={(event) => changeFilter("criticalityClassId", event.target.value)}>
                <option value="">Любая</option>{(criticalitiesQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select></label>
            <label>Статус<select value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}>
                <option value="">Все статусы</option><option value="ACTIVE">Активен</option><option value="INACTIVE">Неактивен</option>
            </select></label>
        </div>
        {(regionsQuery.isError || typesQuery.isError || criticalitiesQuery.isError) &&
            <p className={styles.error} role="alert">Не удалось загрузить фильтры справочников. Обновите страницу.</p>}
        {sitesQuery.isPending && <p role="status">Загрузка объектов…</p>}
        {sitesQuery.isError && <div className={styles.error} role="alert"><p>{siteErrorMessage(sitesQuery.error, "Не удалось загрузить список объектов.")}</p>
            <button type="button" onClick={() => { void sitesQuery.refetch(); }}>Повторить</button></div>}
        {sitesQuery.data && sitesQuery.data.items.length === 0 && <div className={styles.emptyState}>
            <h2>Объекты не найдены</h2><p>Измените фильтры или создайте объект.</p>
        </div>}
        {sitesQuery.data && sitesQuery.data.items.length > 0 && <>
            <div className={styles.tableWrap}><table className={styles.table}>
                <thead><tr><th>Код</th><th>Название</th><th>Регион</th><th>Тип</th><th>Критичность</th><th>Статус</th><th>Часовой пояс</th></tr></thead>
                <tbody>{sitesQuery.data.items.map((site) => <tr key={site.id}>
                    <td><Link to={`/sites/${site.id}`}>{site.code}</Link></td><td>{site.name}</td>
                    <td>{regionsQuery.data?.find((region) => region.id === site.regionId)?.name ?? "Регион недоступен"}</td>
                    <td>{typesQuery.data?.find((item) => item.id === site.siteTypeId)?.name ?? "Тип недоступен"}</td>
                    <td>{criticalitiesQuery.data?.find((item) => item.id === site.criticalityClassId)?.name ?? "Критичность недоступна"}</td>
                    <td><span className={site.status === "ACTIVE" ? styles.activeStatus : styles.inactiveStatus}>{site.status === "ACTIVE" ? "Активен" : "Неактивен"}</span></td>
                    <td>{site.timezone}</td>
                </tr>)}</tbody>
            </table></div>
            <div className={styles.pagination}>
                <span>Всего: {sitesQuery.data.totalCount}. Страница {sitesQuery.data.page} из {sitesQuery.data.totalPages}.</span>
                <div><button type="button" disabled={filters.page <= 1 || sitesQuery.isFetching}
                    onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}>Назад</button>
                    <button type="button" disabled={filters.page >= sitesQuery.data.totalPages || sitesQuery.isFetching}
                        onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Далее</button></div>
            </div>
        </>}
    </section>;
}
