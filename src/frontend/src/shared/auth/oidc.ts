import { UserManager, WebStorageStateStore } from "oidc-client-ts";
import type { OidcPublicConfig } from "../config/environment";

export interface OidcSession {
    accessToken: string;
    expired: boolean;
}

export interface OidcGateway {
    getSession(): Promise<OidcSession | null>;
    completeLogin(): Promise<OidcSession>;
    completeSilent(): Promise<void>;
    login(): Promise<void>;
    renew(): Promise<OidcSession | null>;
    logout(): Promise<void>;
    clear(): Promise<void>;
    onExpired(listener: () => void): () => void;
}

export function createOidcGateway(config: OidcPublicConfig): OidcGateway {
    const manager = new UserManager({
        authority: config.issuer,
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        silent_redirect_uri: new URL("/auth/silent-callback", config.redirectUri).toString(),
        post_logout_redirect_uri: config.postLogoutRedirectUri,
        response_type: "code",
        scope: "openid profile email",
        automaticSilentRenew: true,
        userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    });

    const session = (user: Awaited<ReturnType<UserManager["getUser"]>>): OidcSession | null =>
        user?.access_token ? { accessToken: user.access_token, expired: user.expired ?? true } : null;

    return {
        getSession: async () => session(await manager.getUser()),
        completeLogin: async () => {
            const result = session(await manager.signinRedirectCallback());
            if (!result) throw new Error("OIDC login returned no access token.");
            return result;
        },
        completeSilent: () => manager.signinSilentCallback(),
        login: () => manager.signinRedirect(),
        renew: async () => session(await manager.signinSilent()),
        logout: () => manager.signoutRedirect(),
        clear: () => manager.removeUser(),
        onExpired: (listener) => {
            manager.events.addAccessTokenExpired(listener);
            manager.events.addUserSignedOut(listener);
            return () => {
                manager.events.removeAccessTokenExpired(listener);
                manager.events.removeUserSignedOut(listener);
            };
        },
    };
}
