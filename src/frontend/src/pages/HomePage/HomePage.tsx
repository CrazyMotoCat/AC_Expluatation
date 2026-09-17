import { appText } from "../../shared/config/appText";
import styles from "./HomePage.module.css";

export function HomePage() {
    return (
        <section className={styles.hero}>
            <p className={styles.kicker}>{appText.homeKicker}</p>
            <h1>{appText.homeTitle}</h1>
            <p>{appText.homeDescription}</p>
        </section>
    );
}
