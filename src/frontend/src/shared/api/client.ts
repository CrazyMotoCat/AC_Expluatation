import { environment } from "../config/environment";

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ApiClient {
    request<TResponse>(path: string, init?: RequestInit): Promise<TResponse>;
}

interface CreateApiClientOptions {
    baseUrl: string;
    fetchImplementation?: FetchImplementation;
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
}: CreateApiClientOptions): ApiClient {
    return {
        async request<TResponse>(path: string, init?: RequestInit) {
            const headers = new Headers(init?.headers);

            if (!headers.has("Accept")) {
                headers.set("Accept", "application/json");
            }

            const response = await fetchImplementation(buildRequestUrl(baseUrl, path), {
                ...init,
                headers,
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}.`);
            }

            return (await response.json()) as TResponse;
        },
    };
}

export const apiClient = createApiClient({ baseUrl: environment.apiBaseUrl });
