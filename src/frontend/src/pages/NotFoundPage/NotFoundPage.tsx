import { Link } from "react-router-dom";
import { appText } from "../../shared/config/appText";

export function NotFoundPage() {
    return (
        <section>
            <h1>{appText.notFoundTitle}</h1>
            <p>{appText.notFoundDescription}</p>
            <Link to="/">{appText.notFoundAction}</Link>
        </section>
    );
}
