import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useSession } from "../../app/providers/sessionContext";
import { siteApi, siteErrorMessage, siteQueryKeys, type Site, type SiteReference } from "../../entities/sites/api";
import { SiteForm } from "./SiteForm";
import styles from "./SitesPage.module.css";

export function SiteDetailPage() {
    const { siteId = "" } = useParams();
    const { service, state } = useSession();
    const queryClient = useQueryClient();
    const keys = siteQueryKeys(state.user?.userId ?? null, state.contextId);
    const [editing, setEditing] = useState(false);
    const [changingCriticality, setChangingCriticality] = useState(false);
    const [criticalityId, setCriticalityId] = useState("");
    const [operationError, setOperationError] = useState("");
    const [operationSuccess, setOperationSuccess] = useState("");
    const submitLock = useRef(false);
    const detailQuery = useQuery({ queryKey: keys.detail(siteId), queryFn: ({ signal }) => siteApi.get(siteId, signal), enabled: Boolean(siteId) });
    const regionsQuery = useQuery({ queryKey: keys.regions, queryFn: ({ signal }) => siteApi.regions(signal) });
    const typesQuery = useQuery({ queryKey: keys.siteTypes, queryFn: ({ signal }) => siteApi.siteTypes(signal) });
    const criticalitiesQuery = useQuery({ queryKey: keys.criticalities, queryFn: ({ signal }) => siteApi.criticalities(signal) });
    const site = detailQuery.data;

    function captureSession() {
        const current = service.getState();
        return { generation: service.getSessionGeneration(), userId: current.user?.userId ?? null, contextId: current.contextId };
    }

    function sessionStillMatches(expected: ReturnType<typeof captureSession> | undefined) {
        return expected !== undefined && service.isCurrentSession(expected.generation, expected.userId, expected.contextId);
    }

    async function refresh(expected: ReturnType<typeof captureSession> | undefined, saved?: Site) {
        if (!sessionStillMatches(expected)) return;
        if (saved) queryClient.setQueryData(keys.detail(siteId), saved);
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: keys.detail(siteId) }),
            queryClient.invalidateQueries({ queryKey: keys.lists }),
        ]);
    }

    function mutationOptions(successMessage: string) {
        return {
            onMutate: captureSession,
            onSuccess: async (saved: Site, _variables: unknown, expected: ReturnType<typeof captureSession> | undefined) => {
                if (!sessionStillMatches(expected)) return;
                setOperationError(""); setOperationSuccess(successMessage); await refresh(expected, saved);
            },
            onError: async (error: unknown, _variables: unknown, expected: ReturnType<typeof captureSession> | undefined) => {
                if (!sessionStillMatches(expected)) return;
                setOperationError(siteErrorMessage(error, "Операция недоступна."));
                setOperationSuccess("");
                const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
                if (code === "OPTIMISTIC_CONCURRENCY_CONFLICT") await refresh(expected);
            },
            onSettled: () => { submitLock.current = false; },
        };
    }
    const lifecycleMutation = useMutation({
        mutationFn: (kind: "activate" | "deactivate") => site ? siteApi[kind](siteId, { expectedRowVersion: site.rowVersion }) : Promise.reject(new Error("Site unavailable")),
        ...mutationOptions("Состояние объекта обновлено."),
    });
    const criticalityMutation = useMutation({
        mutationFn: (id: string) => site ? siteApi.changeCriticality(siteId, { criticalityClassId: id, expectedRowVersion: site.rowVersion })
            : Promise.reject(new Error("Site unavailable")),
        ...mutationOptions("Критичность объекта обновлена."),
        onSuccess: async (saved, _id: string, expected: ReturnType<typeof captureSession> | undefined) => {
            if (!sessionStillMatches(expected)) return;
            setOperationError(""); setOperationSuccess("Критичность объекта обновлена."); setChangingCriticality(false); await refresh(expected, saved);
        },
    });

    if (detailQuery.isPending) return <p role="status">Загрузка объекта…</p>;
    if (detailQuery.isError || !site) return <section className={styles.page}>
        <Link className={styles.backLink} to="/sites">← К списку объектов</Link>
        <div className={styles.error} role="alert"><h1>Объект недоступен</h1>
            <p>{siteErrorMessage(detailQuery.error, "Не удалось загрузить объект.")}</p>
            <button type="button" onClick={() => { void detailQuery.refetch(); }}>Повторить</button>
        </div>
    </section>;

    const types = (typesQuery.data ?? []) as SiteReference[];
    const criticalities = (criticalitiesQuery.data ?? []) as SiteReference[];
    const currentCriticality = criticalities.find((item) => item.id === site.criticalityClassId);
    const criticalityChoices = criticalities.filter((item) => item.status === "ACTIVE" || item.id === site.criticalityClassId);
    return <section className={styles.page}>
        <Link className={styles.backLink} to="/sites">← К списку объектов</Link>
        <div className={styles.pageHeading}><div><p className={styles.eyebrow}>Карточка объекта</p><h1>{site.name}</h1><p>{site.code}</p></div>
            {!editing && <div className={styles.formActions}>
                <button type="button" onClick={() => { setOperationError(""); setOperationSuccess(""); setEditing(true); }}>Редактировать</button>
                <button type="button" className={styles.secondaryButton} disabled={lifecycleMutation.isPending}
                    onClick={() => {
                        const action = site.status === "ACTIVE" ? "deactivate" : "activate";
                        if (!window.confirm(action === "deactivate" ? "Деактивировать объект?" : "Активировать объект?")) return;
                        if (submitLock.current) return;
                        submitLock.current = true; setOperationError(""); setOperationSuccess(""); lifecycleMutation.mutate(action);
                    }}>{site.status === "ACTIVE" ? "Деактивировать" : "Активировать"}</button>
                <button type="button" className={styles.secondaryButton} onClick={() => {
                    setCriticalityId(site.criticalityClassId); setOperationError(""); setOperationSuccess(""); setChangingCriticality(true);
                }}>Изменить критичность</button>
            </div>}
        </div>
        {operationError && <p className={styles.error} role="alert">{operationError}</p>}
        {operationSuccess && <p className={styles.success} role="status">{operationSuccess}</p>}
        {editing ? <div className={styles.formPanel}><h2>Редактирование объекта</h2>
            <SiteForm site={site} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); setOperationSuccess("Изменения сохранены."); }} />
        </div> : <div className={styles.cardSections}>
            <section className={styles.cardSection} aria-labelledby="site-information-title">
                <h2 id="site-information-title">Общая информация</h2>
                <dl className={styles.details}>
                    <div><dt>Код</dt><dd>{site.code}</dd></div><div><dt>Название</dt><dd>{site.name}</dd></div>
                    <div><dt>Регион</dt><dd>{regionsQuery.data?.find((region) => region.id === site.regionId)?.name ?? "Регион недоступен"}</dd></div>
                    <div><dt>Тип объекта</dt><dd>{referenceLabel(types, site.siteTypeId)}</dd></div>
                    <div><dt>Адрес</dt><dd>{site.address}</dd></div><div><dt>Часовой пояс</dt><dd>{site.timezone}</dd></div>
                    <div><dt>Статус</dt><dd>{site.status === "ACTIVE" ? "Активен" : "Неактивен"}</dd></div>
                </dl>
            </section>
            <section className={styles.cardSection} aria-labelledby="site-criticality-title">
                <h2 id="site-criticality-title">Критичность</h2>
                <dl className={styles.details}><div><dt>Класс критичности</dt><dd>
                    {currentCriticality ? `${currentCriticality.name}${currentCriticality.status === "INACTIVE" ? " (неактивна)" : ""}` : "Класс критичности недоступен"}
                </dd></div></dl>
            </section>
            <section className={styles.cardSection} aria-labelledby="site-locations-title">
                <h2 id="site-locations-title">Локации</h2>
                <p className={styles.placeholder}>Раздел будет доступен после настройки локаций.</p>
            </section>
            <section className={styles.cardSection} aria-labelledby="site-assets-title">
                <h2 id="site-assets-title">Сводка по оборудованию</h2>
                <p className={styles.placeholder}>Сводка по оборудованию будет доступна после подключения реестра активов.</p>
            </section>
            <section className={styles.cardSection} aria-labelledby="site-responsible-directions-title">
                <h2 id="site-responsible-directions-title">Ответственные направления</h2>
                <p className={styles.placeholder}>Раздел будет доступен после настройки ответственных направлений.</p>
            </section>
        </div>}
        {changingCriticality && <div className={styles.dialogBackdrop} role="presentation"><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="criticality-title">
            <h2 id="criticality-title">Изменить критичность</h2>
            <label>Класс критичности<select value={criticalityId} onChange={(event) => setCriticalityId(event.target.value)}>
                {criticalityChoices.map((item) => <option key={item.id} value={item.id} disabled={item.status !== "ACTIVE"}>
                    {item.name}{item.status === "INACTIVE" ? " (неактивна, текущее значение)" : ""}
                </option>)}
            </select></label>
            <div className={styles.formActions}><button type="button" disabled={!criticalityId || criticalityId === site.criticalityClassId || criticalityMutation.isPending || lifecycleMutation.isPending}
                onClick={() => {
                    if (submitLock.current) return;
                    submitLock.current = true; criticalityMutation.mutate(criticalityId);
                }}>Сохранить</button>
                <button type="button" className={styles.secondaryButton} onClick={() => setChangingCriticality(false)}>Отмена</button></div>
        </section></div>}
    </section>;
}

function referenceLabel(items: SiteReference[], id: string) {
    const item = items.find((reference) => reference.id === id);
    return item ? `${item.name}${item.status === "INACTIVE" ? " (неактивен)" : ""}` : "Тип объекта недоступен";
}
