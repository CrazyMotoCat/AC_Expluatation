import { createContext, useContext, useSyncExternalStore } from "react";
import type { SessionService } from "../../entities/session/SessionService";

export const SessionContext = createContext<SessionService | null>(null);

export function useSession() {
    const service = useContext(SessionContext);
    if (!service) throw new Error("SessionProvider is missing.");
    return { service, state: useSyncExternalStore(service.subscribe, service.getState) };
}
