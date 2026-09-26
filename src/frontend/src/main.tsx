import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { QueryProvider } from "./app/providers/QueryProvider";
import { SessionProvider } from "./app/providers/SessionProvider";
import "./app/styles/global.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
    throw new Error("Frontend root element was not found.");
}

createRoot(rootElement).render(
    <QueryProvider>
        <SessionProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </SessionProvider>
    </QueryProvider>,
);
