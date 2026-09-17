import { resolveApiBaseUrl } from "../../../src/frontend/src/shared/config/environment";

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
