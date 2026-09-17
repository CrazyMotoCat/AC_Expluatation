import { createQueryClient } from "../../../src/frontend/src/app/providers/queryClient";

describe("createQueryClient", () => {
    it("creates shared defaults for server state", () => {
        const queryClient = createQueryClient();
        const options = queryClient.getDefaultOptions();

        expect(options.queries?.retry).toBe(1);
        expect(options.queries?.staleTime).toBe(30_000);
        expect(options.queries?.refetchOnWindowFocus).toBe(false);
        expect(options.mutations?.retry).toBe(false);
    });
});
