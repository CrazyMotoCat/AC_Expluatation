import { createApiClient } from "../../../src/frontend/src/shared/api/client";

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
});
