import { createQueryClient } from "../../../src/frontend/src/app/providers/queryClient";
import { SessionService, type SessionApi } from "../../../src/frontend/src/entities/session/SessionService";
import type { CurrentUser, WorkingContext } from "../../../src/frontend/src/entities/session/api";
import type { OidcGateway } from "../../../src/frontend/src/shared/auth/oidc";

const user: CurrentUser = {
    userId: "user-1", identityKey: { issuer: "issuer", subject: "subject" },
    displayName: "Operator", email: "operator@example.test", userType: "ADMIN", status: "ACTIVE",
};
const context: WorkingContext = {
    id: "0199e000-0000-7000-8000-000000000001", contextType: "ORGANIZATION",
    contextEntityId: null, name: "East", validFrom: "2026-09-01T00:00:00Z", validTo: null,
};

function fixture(authenticated = true) {
    const session = { accessToken: "private-token", expired: false };
    const gateway: OidcGateway = {
        getSession: vi.fn().mockResolvedValue(authenticated ? session : null),
        completeLogin: vi.fn().mockResolvedValue(session),
        completeSilent: vi.fn().mockResolvedValue(undefined),
        login: vi.fn().mockResolvedValue(undefined),
        renew: vi.fn().mockResolvedValue(session),
        logout: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        onExpired: vi.fn().mockReturnValue(() => undefined),
    };
    const api: SessionApi = {
        currentUser: vi.fn().mockResolvedValue(user),
        contexts: vi.fn().mockResolvedValue({ contexts: [context], appliedContextId: null }),
        selectContext: vi.fn().mockResolvedValue(context),
    };
    const storage = new Map<string, string>();
    const client = createQueryClient();
    const service = new SessionService(gateway, api, client, {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => { storage.set(key, value); },
        removeItem: (key) => { storage.delete(key); },
    });
    return { service, gateway, api, client, storage };
}

describe("canonical session", () => {
    it("bootstraps without calling /me when unauthenticated and starts login redirect", async () => {
        const { service, gateway, api } = fixture(false);
        await service.bootstrap(false);
        expect(service.getState().status).toBe("unauthenticated");
        expect(api.currentUser).not.toHaveBeenCalled();
        await service.login();
        expect(gateway.login).toHaveBeenCalledOnce();
    });

    it("handles the OIDC callback, loads /me and available contexts, without deriving grants", async () => {
        const { service, gateway, api } = fixture();
        await service.bootstrap(true);
        expect(gateway.completeLogin).toHaveBeenCalledOnce();
        expect(api.currentUser).toHaveBeenCalledOnce();
        expect(api.contexts).toHaveBeenCalledOnce();
        expect(service.getState()).toMatchObject({ status: "authenticated", user, contexts: [context] });
        expect(JSON.stringify(service.getState())).not.toContain("private-token");
        expect(JSON.stringify(service.getState())).not.toContain("permissions");
        expect(service.getState().user?.userType).toBe("ADMIN");
    });

    it("selects a backend validated context and removes cached context data", async () => {
        const { service, api, client, storage } = fixture();
        await service.bootstrap(false);
        client.setQueryData(["scoped-records"], ["old-context"]);
        client.setQueryData(["capabilities"], ["old-context"]);
        await service.selectContext(context.id);
        expect(api.selectContext).toHaveBeenCalledWith(context.id);
        expect(service.getContextId()).toBe(context.id);
        expect(service.getState().contextId).toBe(context.id);
        expect(client.getQueryData(["scoped-records"])).toBeUndefined();
        expect(client.getQueryData(["capabilities"])).toBeUndefined();
        expect(storage.get("exploitation:context:user-1")).toBe(context.id);
    });

    it("restores only a context still returned by the backend", async () => {
        const { service, storage } = fixture();
        storage.set("exploitation:context:user-1", "unknown");
        await service.bootstrap(false);
        expect(service.getContextId()).toBeNull();
        expect(storage.size).toBe(0);
    });

    it("expires the local session on 401 and clears tokens, context and caches", async () => {
        const { service, gateway, client } = fixture();
        await service.bootstrap(false);
        await service.selectContext(context.id);
        client.setQueryData(["scoped-records"], ["sensitive"]);
        await service.onUnauthorized();
        expect(gateway.clear).toHaveBeenCalledOnce();
        expect(service.getState().status).toBe("unauthenticated");
        expect(service.getContextId()).toBeNull();
        expect(client.getQueryData(["scoped-records"])).toBeUndefined();
    });

    it("renews an expired access token and redirects to logout", async () => {
        const { service, gateway } = fixture();
        vi.mocked(gateway.getSession).mockResolvedValue({ accessToken: "old", expired: true });
        expect(await service.getAccessToken()).toBe("private-token");
        expect(gateway.renew).toHaveBeenCalledOnce();
        await service.logout();
        expect(gateway.logout).toHaveBeenCalledOnce();
        expect(gateway.clear).toHaveBeenCalledOnce();
        expect(service.getState().status).toBe("unauthenticated");
    });

    it("ends the session when renewal fails", async () => {
        const { service, gateway } = fixture();
        await service.bootstrap(false);
        vi.mocked(gateway.getSession).mockResolvedValue({ accessToken: "expired", expired: true });
        vi.mocked(gateway.renew).mockRejectedValue(new Error("sensitive OIDC failure"));
        expect(await service.getAccessToken()).toBeNull();
        expect(service.getState().status).toBe("unauthenticated");
        expect(gateway.clear).toHaveBeenCalledOnce();
    });

    it("clears an authenticated session when the OIDC user disappears", async () => {
        const { service, gateway, client } = fixture();
        await service.bootstrap(false);
        await service.selectContext(context.id);
        client.setQueryData(["scoped-records"], ["sensitive"]);
        vi.mocked(gateway.getSession).mockResolvedValue(null);
        expect(await service.getAccessToken()).toBeNull();
        expect(service.getState().status).toBe("unauthenticated");
        expect(service.getContextId()).toBeNull();
        expect(client.getQueryData(["scoped-records"])).toBeUndefined();
    });

    it("fails closed when the OIDC store cannot be read", async () => {
        const { service, gateway } = fixture();
        await service.bootstrap(false);
        vi.mocked(gateway.getSession).mockRejectedValue(new Error("store failure"));
        expect(await service.getAccessToken()).toBeNull();
        expect(service.getState().status).toBe("unauthenticated");
    });

    it("does not bootstrap with an expired token when renewal fails", async () => {
        const { service, gateway, api } = fixture();
        vi.mocked(gateway.getSession).mockResolvedValue({ accessToken: "expired", expired: true });
        vi.mocked(gateway.renew).mockRejectedValue(new Error("renew failed"));
        await service.bootstrap(false);
        expect(service.getState().status).toBe("unauthenticated");
        expect(api.currentUser).not.toHaveBeenCalled();
    });

    it("does not apply a context rejected by the backend", async () => {
        const { service, api } = fixture();
        await service.bootstrap(false);
        vi.mocked(api.selectContext).mockRejectedValue(new Error("context denied"));
        await expect(service.selectContext(context.id)).rejects.toThrow();
        expect(service.getContextId()).toBeNull();
    });

    it("keeps the latest context choice when backend responses arrive out of order", async () => {
        const { service, api, storage } = fixture();
        const secondContext = { ...context, id: "0199e000-0000-7000-8000-000000000002" };
        vi.mocked(api.contexts).mockResolvedValue({ contexts: [context, secondContext], appliedContextId: null });
        await service.bootstrap(false);

        let finishFirst!: (value: WorkingContext) => void;
        vi.mocked(api.selectContext).mockImplementation((contextId) => contextId === context.id
            ? new Promise<WorkingContext>((resolve) => { finishFirst = resolve; })
            : Promise.resolve(secondContext));

        const first = service.selectContext(context.id);
        await service.selectContext(secondContext.id);
        finishFirst(context);
        await first;

        expect(service.getContextId()).toBe(secondContext.id);
        expect(service.getState().contextId).toBe(secondContext.id);
        expect(storage.get("exploitation:context:user-1")).toBe(secondContext.id);
    });
});
