const defaultApiBaseUrl = "/api/v1";

function isSupportedApiBaseUrl(value: string) {
    return (
        (value.startsWith("/") && !value.startsWith("//")) ||
        value.startsWith("http://") ||
        value.startsWith("https://")
    );
}

export function resolveApiBaseUrl(configuredValue: string | undefined) {
    const candidate = configuredValue?.trim();

    if (!candidate) {
        return defaultApiBaseUrl;
    }

    if (!isSupportedApiBaseUrl(candidate)) {
        throw new Error("VITE_API_URL must be an absolute HTTP(S) URL or a root-relative path.");
    }

    const normalized = candidate.replace(/\/+$/, "");
    return normalized || defaultApiBaseUrl;
}

export const environment = Object.freeze({
    apiBaseUrl: resolveApiBaseUrl(import.meta.env.VITE_API_URL),
    oidc: resolveOidcConfig(import.meta.env, typeof window === "undefined" ? "http://localhost" : window.location.origin),
});

export interface OidcPublicConfig {
    issuer: string;
    clientId: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
}

export function resolveOidcConfig(values: Pick<ImportMetaEnv,
    "VITE_OIDC_ISSUER" | "VITE_OIDC_CLIENT_ID" | "VITE_OIDC_REDIRECT_URI" | "VITE_OIDC_POST_LOGOUT_REDIRECT_URI">,
origin: string): OidcPublicConfig | null {
    const issuer = values.VITE_OIDC_ISSUER?.trim();
    const clientId = values.VITE_OIDC_CLIENT_ID?.trim();
    if (!issuer || !clientId) return null;

    const redirectUri = values.VITE_OIDC_REDIRECT_URI?.trim() || `${origin}/auth/callback`;
    const postLogoutRedirectUri = values.VITE_OIDC_POST_LOGOUT_REDIRECT_URI?.trim() || `${origin}/`;
    for (const [name, value] of Object.entries({ issuer, redirectUri, postLogoutRedirectUri })) {
        if (!URL.canParse(value) || !["http:", "https:"].includes(new URL(value).protocol)) {
            throw new Error(`${name} must be an absolute HTTP(S) URL.`);
        }
    }
    if (new URL(redirectUri).origin !== origin || new URL(postLogoutRedirectUri).origin !== origin) {
        throw new Error("OIDC redirect URLs must use the application origin.");
    }
    return { issuer, clientId, redirectUri, postLogoutRedirectUri };
}
