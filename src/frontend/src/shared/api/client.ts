import { environment } from "../config/environment";
import { createHttpApiError, createNetworkApiError } from "./errors";

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
            const requestUrl = buildRequestUrl(baseUrl, path);

            if (!headers.has("Accept")) {
                headers.set("Accept", "application/json");
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
                throw await createHttpApiError(response);
            }

            return (await response.json()) as TResponse;
        },
    };
}

export const apiClient = createApiClient({ baseUrl: environment.apiBaseUrl });
