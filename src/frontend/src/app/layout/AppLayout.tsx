import { NavLink, Outlet } from "react-router-dom";
import { appText } from "../../shared/config/appText";
import { useState } from "react";
import { useSession } from "../providers/sessionContext";
import styles from "./AppLayout.module.css";

function getNavigationClassName({ isActive }: { isActive: boolean }) {
    return isActive ? `${styles.navigationLink} ${styles.active}` : styles.navigationLink;
}

export function AppLayout() {
    const { service, state } = useSession();
    const [contextError, setContextError] = useState(false);
    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>{appText.productKind}</p>
                    <p className={styles.productName}>{appText.productName}</p>
                </div>
                <div className={styles.sessionControls}>
                    <span className={styles.environmentBadge}>{state.user?.displayName ?? state.user?.email ?? "Пользователь"}</span>
                    <label htmlFor="working-context">Рабочий контекст</label>
                    <select id="working-context" value={state.contextId ?? ""} onChange={(event) => {
                        setContextError(false);
                        void service.selectContext(event.target.value || null).catch(() => setContextError(true));
                    }}>
                        <option value="">Без контекста</option>
                        {state.contexts.map((context) => <option key={context.id} value={context.id}>{context.name}</option>)}
                    </select>
                    <button type="button" onClick={() => { void service.logout(); }}>Выйти</button>
                </div>
            </header>
            {contextError && <p role="alert">Не удалось выбрать рабочий контекст.</p>}

            <nav aria-label={appText.primaryNavigationLabel} className={styles.navigation}>
                <NavLink className={getNavigationClassName} end to="/">
                    {appText.homeNavigationLabel}
                </NavLink>
                <NavLink className={getNavigationClassName} to="/system">
                    {appText.systemNavigationLabel}
                </NavLink>
                <NavLink className={getNavigationClassName} to="/sites">
                    Объекты
                </NavLink>
            </nav>

            <main className={styles.content}>
                <Outlet />
            </main>

            <footer className={styles.footer}>{appText.footerText}</footer>
        </div>
    );
}
