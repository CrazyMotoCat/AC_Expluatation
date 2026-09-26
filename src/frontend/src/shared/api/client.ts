import { environment } from "../config/environment";
import { createHttpApiError, createNetworkApiError } from "./errors";

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ApiClient {
    request<TResponse>(path: string, init?: RequestInit): Promise<TResponse>;
}

interface CreateApiClientOptions {
    baseUrl: string;
    fetchImplementation?: FetchImplementation;
    auth?: ApiAuth;
}

export interface ApiAuth {
    getAccessToken(): Promise<string | null>;
    getContextId(): string | null;
    onUnauthorized(): Promise<void>;
}

let appAuth: ApiAuth | null = null;

export function setAppApiAuth(auth: ApiAuth | null) {
    appAuth = auth;
}

function buildRequestUrl(baseUrl: string, path: string) {
    if (!path.startsWith("/")) {
        throw new Error("API request path must start with '/'.");
    }

    return `${baseUrl}${path}`;
}

export function createApiClient({
    baseUrl,
    fetchImplementation = globalThis.fetch,
    auth,
}: CreateApiClientOptions): ApiClient {
    return {
        async request<TResponse>(path: string, init?: RequestInit) {
            const headers = new Headers(init?.headers);
            const requestUrl = buildRequestUrl(baseUrl, path);
            const requestAuth = auth ?? appAuth;

            if (!headers.has("Accept")) {
                headers.set("Accept", "application/json");
            }

            if (requestAuth) {
                headers.delete("Authorization");
                headers.delete("X-Work-Context-Id");
                const token = await requestAuth.getAccessToken();
                if (token) headers.set("Authorization", `Bearer ${token}`);
                const contextId = requestAuth.getContextId();
                if (contextId && path !== "/me/context") headers.set("X-Work-Context-Id", contextId);
            }

            let response: Response;

            try {
                response = await fetchImplementation(requestUrl, {
                    ...init,
                    headers,
                });
            } catch {
                throw createNetworkApiError();
            }

            if (!response.ok) {
                if (response.status === 401 && requestAuth) await requestAuth.onUnauthorized();
                throw await createHttpApiError(response);
            }

            return (await response.json()) as TResponse;
        },
    };
}

export const apiClient = createApiClient({ baseUrl: environment.apiBaseUrl });
