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
});
