import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type PropsWithChildren } from "react";
import { sessionApi } from "../../entities/session/api";
import { SessionService } from "../../entities/session/SessionService";
import { setAppApiAuth } from "../../shared/api/client";
import { createOidcGateway } from "../../shared/auth/oidc";
import { environment } from "../../shared/config/environment";
import { SessionContext, useSession } from "./sessionContext";

function SessionGate({ children }: PropsWithChildren) {
    const { service, state } = useSession();
    if (state.status === "loading") return <main role="status">Загрузка сеанса…</main>;
    if (state.status === "error") return <main role="alert">{state.error}
        {environment.oidc && <button type="button" onClick={() => { void service.logout(); }}>Выйти</button>}
    </main>;
    if (state.status === "unauthenticated") return <main>
        <h1>Вход в АС «Эксплуатация»</h1>
        <button type="button" onClick={() => { void service.login(); }}>Войти</button>
    </main>;
    return children;
}

export function SessionProvider({ children }: PropsWithChildren) {
    const queryClient = useQueryClient();
    const [service] = useState(() => new SessionService(
        environment.oidc ? createOidcGateway(environment.oidc) : null,
        sessionApi,
        queryClient,
        window.sessionStorage,
    ));

    useEffect(() => {
        setAppApiAuth(service);
        if (window.location.pathname === "/auth/silent-callback") {
            void service.completeSilent();
            return () => { setAppApiAuth(null); service.dispose(); };
        }
        const callback = window.location.pathname === "/auth/callback";
        void service.bootstrap(callback).finally(() => {
            if (callback) window.history.replaceState(null, "", "/");
        });
        return () => {
            setAppApiAuth(null);
            service.dispose();
        };
    }, [service]);

    return <SessionContext.Provider value={service}><SessionGate>{children}</SessionGate></SessionContext.Provider>;
}
