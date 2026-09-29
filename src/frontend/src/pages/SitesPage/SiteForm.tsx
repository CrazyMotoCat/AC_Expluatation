import { useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../app/providers/sessionContext";
import {
    activeReferences, isActiveRegionSelection, siteApi, siteErrorMessage, siteQueryKeys,
    type CreateSiteRequest, type Site, type UpdateSiteRequest,
} from "../../entities/sites/api";
import styles from "./SitesPage.module.css";

const codePattern = /^[A-Z0-9][A-Z0-9_-]{0,49}$/;

interface SiteFormProps {
    site?: Site;
    onCancel?: () => void;
    onSaved?: (site: Site) => void;
}

export function SiteForm({ site, onCancel, onSaved }: SiteFormProps) {
    const { service, state } = useSession();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const keys = siteQueryKeys(state.user?.userId ?? null, state.contextId);
    const creating = site === undefined;
    const [code, setCode] = useState(site?.code ?? "");
    const [name, setName] = useState(site?.name ?? "");
    const [regionId, setRegionId] = useState(site?.regionId ?? "");
    const [siteTypeId, setSiteTypeId] = useState(site?.siteTypeId ?? "");
    const [criticalityClassId, setCriticalityClassId] = useState(site?.criticalityClassId ?? "");
    const [address, setAddress] = useState(site?.address ?? "");
    const [timezone, setTimezone] = useState(site?.timezone ?? "");
    const [formError, setFormError] = useState("");
    const [codeError, setCodeError] = useState("");
    const [showConflictReview, setShowConflictReview] = useState(false);
    const submitLock = useRef(false);

    function captureSession() {
        const current = service.getState();
        return { generation: service.getSessionGeneration(), userId: current.user?.userId ?? null, contextId: current.contextId };
    }

    function sessionStillMatches(expected: ReturnType<typeof captureSession> | undefined) {
        return expected !== undefined && service.isCurrentSession(expected.generation, expected.userId, expected.contextId);
    }

    const regionsQuery = useQuery({ queryKey: keys.regions, queryFn: ({ signal }) => siteApi.regions(signal) });
    const typesQuery = useQuery({ queryKey: keys.siteTypes, queryFn: ({ signal }) => siteApi.siteTypes(signal) });
    const criticalitiesQuery = useQuery({ queryKey: keys.criticalities, queryFn: ({ signal }) => siteApi.criticalities(signal) });
    const referencesLoading = regionsQuery.isPending || typesQuery.isPending || criticalitiesQuery.isPending;
    const referencesFailed = regionsQuery.isError || typesQuery.isError || criticalitiesQuery.isError;
    const types = useMemo(() => activeReferences(typesQuery.data ?? [], site?.siteTypeId), [typesQuery.data, site?.siteTypeId]);
    const criticalities = useMemo(() => activeReferences(criticalitiesQuery.data ?? [], creating ? undefined : site?.criticalityClassId),
        [criticalitiesQuery.data, creating, site?.criticalityClassId]);

    const saveMutation = useMutation({
        mutationFn: (request: CreateSiteRequest | UpdateSiteRequest) => creating
            ? siteApi.create(request as CreateSiteRequest)
            : siteApi.update(site.id, request as UpdateSiteRequest),
        onMutate: captureSession,
        onSuccess: async (saved, _request, expected: ReturnType<typeof captureSession> | undefined) => {
            if (!sessionStillMatches(expected)) return;
            await queryClient.invalidateQueries({ queryKey: keys.lists });
            if (!sessionStillMatches(expected)) return;
            await queryClient.invalidateQueries({ queryKey: ["sites", ...keys.sessionContext, "detail", saved.id] });
            if (!sessionStillMatches(expected)) return;
            if (creating) navigate(`/sites/${saved.id}`);
            else onSaved?.(saved);
        },
        onError: async (error, _request, expected: ReturnType<typeof captureSession> | undefined) => {
            if (!sessionStillMatches(expected)) return;
            const message = siteErrorMessage(error, "Не удалось сохранить объект.");
            setFormError(message);
            const codeValue = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
            if (codeValue === "SITE_CODE_ALREADY_EXISTS") setCodeError(message);
            if (codeValue === "OPTIMISTIC_CONCURRENCY_CONFLICT") {
                setShowConflictReview(true);
                await queryClient.invalidateQueries({ queryKey: keys.detail(site?.id ?? "") });
            }
            if (codeValue === "GEOGRAPHY_ACCESS_DENIED") {
                await queryClient.invalidateQueries({ queryKey: keys.regions });
            }
        },
        onSettled: () => { submitLock.current = false; },
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitLock.current || saveMutation.isPending) return;
        setFormError("");
        setCodeError("");
        const normalizedCode = code.trim().toUpperCase();
        if (creating && !codePattern.test(normalizedCode)) {
            setCodeError("Код обязателен: до 50 символов, латинские заглавные буквы, цифры, _ или -.");
            return;
        }
        if (!name.trim() || name.trim().length > 200 || !address.trim() || address.trim().length > 500 || !timezone.trim()) {
            setFormError("Заполните название, адрес (до 500 символов) и часовой пояс. Название не должно превышать 200 символов.");
            return;
        }
        if (!siteTypeId || (creating && (!regionId || !criticalityClassId))) {
            setFormError("Выберите регион, тип объекта и класс критичности.");
            return;
        }
        if (creating && !isActiveRegionSelection(regionsQuery.data ?? [], regionId)) {
            setRegionId("");
            setFormError("Выберите активный регион из текущего рабочего контекста.");
            return;
        }
        submitLock.current = true;
        if (creating) {
            saveMutation.mutate({ regionId, siteTypeId, criticalityClassId, code: normalizedCode,
                name: name.trim(), address: address.trim(), timezone: timezone.trim() });
        } else {
            saveMutation.mutate({ name: name.trim(), siteTypeId, address: address.trim(), timezone: timezone.trim(),
                expectedRowVersion: site.rowVersion });
        }
    }

    if (referencesLoading) return <p role="status">Загрузка справочных данных…</p>;
    if (referencesFailed) return <div role="alert"><p>Не удалось загрузить справочные данные.</p>
        <button type="button" onClick={() => { void regionsQuery.refetch(); void typesQuery.refetch(); void criticalitiesQuery.refetch(); }}>Повторить</button></div>;

    return <form className={styles.form} onSubmit={submit}>
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        {creating && <>
            <label>Регион<select required value={regionId} onChange={(event) => setRegionId(event.target.value)}>
                <option value="">Выберите регион</option>
                {(regionsQuery.data ?? []).map((region) => <option key={region.id} value={region.id} disabled={region.status !== "ACTIVE"}>
                    {region.name}{region.status === "INACTIVE" ? " (неактивен)" : ""}
                </option>)}
            </select></label>
            <label>Код объекта<input required maxLength={50} value={code} aria-invalid={Boolean(codeError)} aria-describedby={codeError ? "site-code-error" : undefined}
                onChange={(event) => { setCode(event.target.value); setCodeError(""); }} />
                {codeError && <span id="site-code-error" className={styles.fieldError}>{codeError}</span>}
            </label>
        </>}
        {!creating && <>
            <label>Код объекта<input value={site.code} readOnly /></label>
            <label>Регион<input value={regionsQuery.data?.find((item) => item.id === site.regionId)?.name ?? "Регион недоступен"} readOnly /></label>
        </>}
        <label>Название<input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Тип объекта<select required value={siteTypeId} onChange={(event) => setSiteTypeId(event.target.value)}>
            <option value="">Выберите тип объекта</option>
            {types.map((item) => <option key={item.id} value={item.id} disabled={item.status !== "ACTIVE"}>
                {item.name}{item.status === "INACTIVE" ? " (неактивен, текущее значение)" : ""}
            </option>)}
        </select></label>
        {creating && <label>Критичность<select required value={criticalityClassId} onChange={(event) => setCriticalityClassId(event.target.value)}>
            <option value="">Выберите класс критичности</option>
            {criticalities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>}
        <label>Адрес<textarea required maxLength={500} rows={3} value={address} onChange={(event) => setAddress(event.target.value)} /></label>
        <label>Часовой пояс IANA<input required list="site-timezones" value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="Например, Asia/Vladivostok" />
            <datalist id="site-timezones">{timeZoneChoices().map((value) => <option key={value} value={value} />)}</datalist>
        </label>
        {showConflictReview && site && <aside className={styles.conflictReview} aria-label="Актуальные данные объекта">
            <h2>Актуальная версия объекта</h2>
            <p>Ваши введённые значения сохранены в форме. Сверьте их с текущими данными перед повторной отправкой.</p>
            <dl><div><dt>Название</dt><dd>{site.name}</dd></div><div><dt>Тип объекта</dt><dd>{typesQuery.data?.find((item) => item.id === site.siteTypeId)?.name ?? "Тип недоступен"}</dd></div>
                <div><dt>Адрес</dt><dd>{site.address}</dd></div><div><dt>Часовой пояс</dt><dd>{site.timezone}</dd></div><div><dt>Версия</dt><dd>{site.rowVersion}</dd></div></dl>
        </aside>}
        <div className={styles.formActions}>
            <button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Сохранение…" : creating ? "Создать объект" : "Сохранить"}</button>
            {onCancel && <button type="button" className={styles.secondaryButton} onClick={onCancel}>Отмена</button>}
        </div>
    </form>;
}

function timeZoneChoices() {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
    if (!intl.supportedValuesOf) return ["UTC"];
    return ["UTC", ...intl.supportedValuesOf("timeZone")];
}
