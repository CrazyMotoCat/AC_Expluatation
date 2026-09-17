import { NavLink, Outlet } from "react-router-dom";
import { appText } from "../../shared/config/appText";
import styles from "./AppLayout.module.css";

function getNavigationClassName({ isActive }: { isActive: boolean }) {
    return isActive ? `${styles.navigationLink} ${styles.active}` : styles.navigationLink;
}

export function AppLayout() {
    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>{appText.productKind}</p>
                    <p className={styles.productName}>{appText.productName}</p>
                </div>
                <span className={styles.environmentBadge}>{appText.bootstrapBadge}</span>
            </header>

            <nav aria-label={appText.primaryNavigationLabel} className={styles.navigation}>
                <NavLink className={getNavigationClassName} end to="/">
                    {appText.homeNavigationLabel}
                </NavLink>
                <NavLink className={getNavigationClassName} to="/system">
                    {appText.systemNavigationLabel}
                </NavLink>
            </nav>

            <main className={styles.content}>
                <Outlet />
            </main>

            <footer className={styles.footer}>{appText.footerText}</footer>
        </div>
    );
}
