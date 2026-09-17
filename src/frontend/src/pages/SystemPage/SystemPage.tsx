import { appText } from "../../shared/config/appText";
import { environment } from "../../shared/config/environment";
import styles from "./SystemPage.module.css";

export function SystemPage() {
    return (
        <section className={styles.card}>
            <h1>{appText.systemTitle}</h1>
            <p>{appText.systemDescription}</p>
            <dl>
                <div>
                    <dt>{appText.apiBaseUrlLabel}</dt>
                    <dd>
                        <code>{environment.apiBaseUrl}</code>
                    </dd>
                </div>
            </dl>
        </section>
    );
}
