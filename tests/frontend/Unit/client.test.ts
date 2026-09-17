import { createApiClient } from "../../../src/frontend/src/shared/api/client";
import { isApiError } from "../../../src/frontend/src/shared/api/errors";

describe("createApiClient", () => {
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
