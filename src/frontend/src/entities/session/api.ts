import { apiClient } from "../../shared/api/client";

export interface CurrentUser {
    userId: string;
    identityKey: { issuer: string; subject: string };
    displayName: string | null;
    email: string | null;
    userType: string;
    status: string;
}

export interface WorkingContext {
    id: string;
    contextType: string;
    contextEntityId: string | null;
    name: string;
    validFrom: string;
    validTo: string | null;
}

export interface OwnWorkingContexts {
    contexts: WorkingContext[];
    appliedContextId: string | null;
}

export const sessionApi = {
    currentUser: () => apiClient.request<CurrentUser>("/me"),
    contexts: () => apiClient.request<OwnWorkingContexts>("/me/contexts"),
    selectContext: (contextId: string) => apiClient.request<WorkingContext>("/me/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextId }),
    }),
};
