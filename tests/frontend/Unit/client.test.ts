import { createApiClient } from "../../../src/frontend/src/shared/api/client";
import { isApiError } from "../../../src/frontend/src/shared/api/errors";

describe("createApiClient", () => {
    it("injects bearer and request-scoped context through one pipeline", async () => {
        const fetchImplementation = vi.fn<typeof fetch>().mockImplementation(async () => new Response("{}", { status: 200 }));
        const auth = {
            getAccessToken: vi.fn().mockResolvedValue("private-token"),
            getContextId: vi.fn().mockReturnValue("context-1"),
            onUnauthorized: vi.fn().mockResolvedValue(undefined),
        };
        const client = createApiClient({ baseUrl: "/api/v1", fetchImplementation, auth });
        await client.request("/me/contexts", { headers: {
            Authorization: "Bearer stale-token", "X-Work-Context-Id": "stale-context",
        } });
        const headers = new Headers(fetchImplementation.mock.calls[0]?.[1]?.headers);
        expect(headers.get("Authorization")).toBe("Bearer private-token");
        expect(headers.get("X-Work-Context-Id")).toBe("context-1");
        expect(fetchImplementation.mock.calls[0]?.[0]).toBe("/api/v1/me/contexts");
        await client.request("/me/context", { method: "POST" });
        expect(new Headers(fetchImplementation.mock.calls[1]?.[1]?.headers).has("X-Work-Context-Id")).toBe(false);
    });

    it("hands a 401 to the session and never exposes a token in the error", async () => {
        const auth = {
            getAccessToken: vi.fn().mockResolvedValue("private-token"),
            getContextId: vi.fn().mockReturnValue(null),
            onUnauthorized: vi.fn().mockResolvedValue(undefined),
        };
        const client = createApiClient({ baseUrl: "/api/v1", auth,
            fetchImplementation: vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 401 })) });
        await expect(client.request("/me")).rejects.toMatchObject({ status: 401 });
        expect(auth.onUnauthorized).toHaveBeenCalledOnce();
    });

    it("does not send an authenticated request to a caller-supplied origin", async () => {
        const fetchImplementation = vi.fn<typeof fetch>();
        const client = createApiClient({ baseUrl: "/api/v1", fetchImplementation, auth: {
            getAccessToken: vi.fn().mockResolvedValue("private-token"),
            getContextId: vi.fn().mockReturnValue(null),
            onUnauthorized: vi.fn().mockResolvedValue(undefined),
        } });
        await expect(client.request("https://unrelated.example.test/collect")).rejects.toThrow(/must start/);
        expect(fetchImplementation).not.toHaveBeenCalled();
    });
    it("sends requests through the configured API base URL", async () => {
        const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(JSON.stringify({ status: "ready" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );
        const client = createApiClient({
            baseUrl: "https://api.example.test/api/v1",
            fetchImplementation,
        });

        const result = await client.request<{ status: string }>("/health/ready");

        expect(result).toEqual({ status: "ready" });
        expect(fetchImplementation).toHaveBeenCalledOnce();
        expect(fetchImplementation.mock.calls[0]?.[0]).toBe(
            "https://api.example.test/api/v1/health/ready",
        );
    });

    it("rejects paths outside the API client boundary", async () => {
        const client = createApiClient({
            baseUrl: "/api/v1",
            fetchImplementation: vi.fn<typeof fetch>(),
        });

        await expect(client.request("health/live")).rejects.toThrow(/must start/);
    });

    it("normalizes an API error response", async () => {
        const client = createApiClient({
            baseUrl: "/api/v1",
            fetchImplementation: vi.fn<typeof fetch>().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        code: "ASSET_NOT_FOUND",
                        message: "Актив не найден.",
                        correlationId: "correlation-123",
                        details: null,
                    }),
                    { status: 404 },
                ),
            ),
        });

        try {
            await client.request("/assets/unknown");
            throw new Error("The request must fail.");
        } catch (error) {
            expect(isApiError(error)).toBe(true);

            if (!isApiError(error)) {
                throw error;
            }

            expect(error.code).toBe("ASSET_NOT_FOUND");
            expect(error.status).toBe(404);
            expect(error.correlationId).toBe("correlation-123");
        }
    });

    it("normalizes a network failure", async () => {
        const client = createApiClient({
            baseUrl: "/api/v1",
            fetchImplementation: vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")),
        });

        await expect(client.request("/health/ready")).rejects.toMatchObject({
            code: "NETWORK_ERROR",
            status: null,
        });
    });
});
