import { resolveApiBaseUrl, resolveOidcConfig } from "../../../src/frontend/src/shared/config/environment";

describe("resolveApiBaseUrl", () => {
    it("uses the versioned API path by default", () => {
        expect(resolveApiBaseUrl(undefined)).toBe("/api/v1");
    });

    it("normalizes a configured API URL", () => {
        expect(resolveApiBaseUrl(" https://api.example.test/api/v1/ ")).toBe(
            "https://api.example.test/api/v1",
        );
    });

    it("rejects unsupported URL formats", () => {
        expect(() => resolveApiBaseUrl("api/v1")).toThrow(/VITE_API_URL/);
    });
});

describe("resolveOidcConfig", () => {
    it("requires a registered public client ID and derives same-origin callbacks", () => {
        expect(resolveOidcConfig({ VITE_OIDC_ISSUER: "https://id.example.test/realm" },
            "https://app.example.test")).toBeNull();
        expect(resolveOidcConfig({ VITE_OIDC_ISSUER: "https://id.example.test/realm",
            VITE_OIDC_CLIENT_ID: "browser-client" }, "https://app.example.test")).toEqual({
                issuer: "https://id.example.test/realm", clientId: "browser-client",
                redirectUri: "https://app.example.test/auth/callback",
                postLogoutRedirectUri: "https://app.example.test/",
            });
    });

    it("rejects a cross-origin redirect", () => {
        expect(() => resolveOidcConfig({ VITE_OIDC_ISSUER: "https://id.example.test/realm",
            VITE_OIDC_CLIENT_ID: "browser-client", VITE_OIDC_REDIRECT_URI: "https://other.example.test/" },
        "https://app.example.test")).toThrow(/application origin/);
    });
});
