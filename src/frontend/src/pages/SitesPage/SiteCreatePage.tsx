import { Link } from "react-router-dom";
import { SiteForm } from "./SiteForm";
import styles from "./SitesPage.module.css";

export function SiteCreatePage() {
    return <section className={styles.page}>
        <Link className={styles.backLink} to="/sites">← К списку объектов</Link>
        <h1>Новый объект</h1>
        <SiteForm />
    </section>;
}
