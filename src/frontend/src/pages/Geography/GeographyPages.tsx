import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useSession } from "../../app/providers/sessionContext";
import { regionsQuery, territorialZonesQuery } from "../../entities/geography/api";
import { geographyErrorMessage } from "../../entities/geography/feedback";
import styles from "./GeographyPages.module.css";

function Status({ status, zone = false }: { status: "ACTIVE" | "INACTIVE"; zone?: boolean }) {
    return <span className={status === "ACTIVE" ? styles.activeStatus : styles.inactiveStatus}>
        {zone ? (status === "ACTIVE" ? "Активна" : "Неактивна") : (status === "ACTIVE" ? "Активен" : "Неактивен")}
    </span>;
}

function PageHeading({ title, refreshing, onRefresh }: { title: string; refreshing: boolean; onRefresh: () => void }) {
    return <div className={styles.pageHeading}>
        <div><p className={styles.eyebrow}>География</p><h1>{title}</h1><p>Данные в выбранном рабочем контексте.</p></div>
        <button type="button" onClick={onRefresh} disabled={refreshing}>Обновить</button>
    </div>;
}

function ListState({ loading, error, empty, fallback, onRetry }: {
    loading: boolean; error: unknown; empty: boolean; fallback: string; onRetry: () => void;
}) {
    if (loading) return <p role="status">Загрузка данных…</p>;
    if (error) return <div className={styles.error} role="alert"><p>{geographyErrorMessage(error, fallback)}</p>
        <button type="button" onClick={onRetry}>Повторить</button></div>;
    if (empty) return <p className={styles.emptyState}>Записей пока нет.</p>;
    return null;
}

export function TerritorialZonesPage() {
    const { state } = useSession();
    const zones = useQuery({ ...territorialZonesQuery(state.user?.userId ?? null, state.contextId),
        enabled: state.status === "authenticated" });
    const refresh = () => { void zones.refetch(); };
    return <section className={styles.page}>
        <PageHeading title="Территориальные зоны" refreshing={zones.isFetching} onRefresh={refresh} />
        <ListState loading={zones.isPending} error={zones.error} empty={zones.data?.length === 0}
            fallback="Не удалось загрузить территориальные зоны." onRetry={refresh} />
        {!zones.isError && zones.data && zones.data.length > 0 && <div className={styles.tableWrap}><table className={styles.table}>
            <thead><tr><th scope="col">Код</th><th scope="col">Название</th><th scope="col">Статус</th></tr></thead>
            <tbody>{zones.data.map((zone) => <tr key={zone.id}>
                <td>{zone.code}</td><td>{zone.name}</td><td><Status status={zone.status} zone /></td>
            </tr>)}</tbody>
        </table></div>}
    </section>;
}

export function RegionsPage() {
    const { state } = useSession();
    const [searchParams, setSearchParams] = useSearchParams();
    const territorialZoneId = searchParams.get("territorialZoneId") ?? "";
    const userId = state.user?.userId ?? null;
    const enabled = state.status === "authenticated";
    const zones = useQuery({ ...territorialZonesQuery(userId, state.contextId), enabled });
    const regions = useQuery({ ...regionsQuery(userId, state.contextId, territorialZoneId), enabled });
    // Labels are supplementary: exact Region scope need not expose the parent Zone.
    const visibleZones = zones.isError ? [] : zones.data ?? [];
    const zoneNames = new Map(visibleZones.map((zone) => [zone.id, zone.name]));
    const refreshRegions = () => { void regions.refetch(); };

    function changeZone(value: string) {
        const next = new URLSearchParams(searchParams);
        next.delete("territorialZoneId");
        if (value) next.set("territorialZoneId", value);
        setSearchParams(next);
    }

    return <section className={styles.page}>
        <PageHeading title="Регионы" refreshing={regions.isFetching} onRefresh={() => {
            refreshRegions(); void zones.refetch();
        }} />
        <div className={styles.filters}>
            <label htmlFor="zone-filter">Территориальная зона
                <select id="zone-filter" value={territorialZoneId} onChange={(event) => changeZone(event.target.value)}>
                    <option value="">Все зоны</option>
                    {territorialZoneId && !zoneNames.has(territorialZoneId) &&
                        <option value={territorialZoneId}>Зона недоступна</option>}
                    {visibleZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                </select>
            </label>
            <button type="button" disabled={!territorialZoneId} onClick={() => changeZone("")}>Сбросить фильтр</button>
        </div>
        {zones.isError && <div className={styles.error} role="alert">
            <p>Не удалось загрузить названия зон. Регионы доступны без уточнения зоны.</p>
            <button type="button" onClick={() => { void zones.refetch(); }}>Повторить загрузку зон</button>
        </div>}
        <ListState loading={regions.isPending} error={regions.error} empty={regions.data?.length === 0}
            fallback="Не удалось загрузить регионы." onRetry={refreshRegions} />
        {!regions.isError && regions.data && regions.data.length > 0 && <div className={styles.tableWrap}><table className={styles.table}>
            <thead><tr><th scope="col">Код</th><th scope="col">Название</th><th scope="col">Территориальная зона</th>
                <th scope="col">Часовой пояс</th><th scope="col">Статус</th></tr></thead>
            <tbody>{regions.data.map((region) => <tr key={region.id}>
                <td>{region.code}</td><td>{region.name}</td><td>{zoneNames.get(region.territorialZoneId) ?? "Зона недоступна"}</td>
                <td>{region.timezone}</td><td><Status status={region.status} /></td>
            </tr>)}</tbody>
        </table></div>}
    </section>;
}
