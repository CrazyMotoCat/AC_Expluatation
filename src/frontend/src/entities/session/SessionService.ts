import type { QueryClient } from "@tanstack/react-query";
import type { ApiAuth } from "../../shared/api/client";
import type { OidcGateway, OidcSession } from "../../shared/auth/oidc";
import type { CurrentUser, OwnWorkingContexts, WorkingContext } from "./api";

export interface SessionApi {
    currentUser(): Promise<CurrentUser>;
    contexts(): Promise<OwnWorkingContexts>;
    selectContext(contextId: string): Promise<WorkingContext>;
}

export interface SessionState {
    status: "loading" | "authenticated" | "unauthenticated" | "error";
    user: CurrentUser | null;
    contexts: WorkingContext[];
    contextId: string | null;
    error: string | null;
}

const initialState: SessionState = {
    status: "loading", user: null, contexts: [], contextId: null, error: null,
};

export class SessionService implements ApiAuth {
    private state: SessionState = initialState;
    private readonly listeners = new Set<() => void>();
    private contextId: string | null = null;
    private userId: string | null = null;
    private expiryUnsubscribe: (() => void) | null = null;
    private generation = 0;

    public constructor(
        private readonly gateway: OidcGateway | null,
        private readonly api: SessionApi,
        private readonly queryClient: QueryClient,
        private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
    ) {}

    public getState = () => this.state;
    public subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    };

    private publish(state: SessionState) {
        this.state = state;
        for (const listener of this.listeners) listener();
    }

    public async bootstrap(callback: boolean) {
        if (!this.gateway) {
            this.publish({ ...initialState, status: "error", error: "OIDC клиент не настроен." });
            return;
        }
        const currentGeneration = ++this.generation;
        this.expiryUnsubscribe?.();
        this.expiryUnsubscribe = this.gateway.onExpired(() => { void this.onUnauthorized(); });
        try {
            const session = callback ? await this.gateway.completeLogin() : await this.gateway.getSession();
            if (!session) {
                this.publish({ ...initialState, status: "unauthenticated" });
                return;
            }
            if (session.expired) {
                try {
                    const renewed = await this.gateway.renew();
                    if (!renewed || renewed.expired) {
                        await this.onUnauthorized();
                        return;
                    }
                } catch {
                    await this.onUnauthorized();
                    return;
                }
            }
            const user = await this.api.currentUser();
            const contexts = await this.api.contexts();
            if (this.generation !== currentGeneration) return;
            this.userId = user.userId;
            const storedContextId = this.storage.getItem(this.contextStorageKey(user.userId));
            this.contextId = contexts.contexts.some((item) => item.id === storedContextId) ? storedContextId : null;
            if (!this.contextId) this.storage.removeItem(this.contextStorageKey(user.userId));
            this.publish({ status: "authenticated", user, contexts: contexts.contexts,
                contextId: this.contextId, error: null });
        } catch {
            if (this.generation === currentGeneration) {
                this.publish({ ...initialState, status: "error", error: "Не удалось загрузить сеанс." });
            }
        }
    }

    public async getAccessToken() {
        if (!this.gateway) return null;
        let session: OidcSession | null;
        try { session = await this.gateway.getSession(); }
        catch {
            await this.onUnauthorized();
            return null;
        }
        if (!session) {
            if (this.state.status === "authenticated") await this.onUnauthorized();
            return null;
        }
        if (!session.expired) return session.accessToken;
        try {
            const renewed: OidcSession | null = await this.gateway.renew();
            if (renewed && !renewed.expired) return renewed.accessToken;
        } catch { /* Session expires below. */ }
        await this.onUnauthorized();
        return null;
    }

    public getContextId = () => this.contextId;

    public async onUnauthorized() {
        ++this.generation;
        if (this.userId) this.storage.removeItem(this.contextStorageKey(this.userId));
        this.contextId = null;
        this.userId = null;
        await this.queryClient.cancelQueries();
        this.queryClient.clear();
        try { await this.gateway?.clear(); } catch { /* Local session still expires. */ }
        this.publish({ ...initialState, status: "unauthenticated" });
    }

    public async login() {
        await this.gateway?.login();
    }

    public async completeSilent() {
        await this.gateway?.completeSilent();
    }

    public async logout() {
        const gateway = this.gateway;
        try { await gateway?.logout(); }
        finally { await this.onUnauthorized(); }
    }

    public async selectContext(contextId: string | null) {
        if (this.state.status !== "authenticated" || !this.userId) return;
        const generation = this.generation;
        const userId = this.userId;
        if (contextId !== null) {
            if (!this.state.contexts.some((context) => context.id === contextId)) {
                throw new Error("Working context is unavailable.");
            }
            const selected = await this.api.selectContext(contextId);
            if (selected.id !== contextId) throw new Error("Working context response did not match selection.");
        }
        if (this.generation !== generation) return;
        await this.queryClient.cancelQueries();
        this.contextId = contextId;
        if (contextId) this.storage.setItem(this.contextStorageKey(userId), contextId);
        else this.storage.removeItem(this.contextStorageKey(userId));
        const reset = this.queryClient.resetQueries();
        this.publish({ ...this.state, contextId });
        await reset;
    }

    public dispose() {
        this.expiryUnsubscribe?.();
        this.expiryUnsubscribe = null;
    }

    private contextStorageKey(userId: string) { return `exploitation:context:${userId}`; }
}
