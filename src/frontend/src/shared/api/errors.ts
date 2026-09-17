export interface ApiErrorPayload {
    code: string;
    message: string;
    correlationId: string | null;
    details: unknown;
}

interface ApiErrorOptions extends ApiErrorPayload {
    status: number | null;
}

export class ApiError extends Error {
    public readonly code: string;
    public readonly correlationId: string | null;
    public readonly details: unknown;
    public readonly status: number | null;

    public constructor({ code, message, correlationId, details, status }: ApiErrorOptions) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.correlationId = correlationId;
        this.details = details;
        this.status = status;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function parseApiErrorPayload(value: unknown): ApiErrorPayload | null {
    if (!isRecord(value) || typeof value.code !== "string" || typeof value.message !== "string") {
        return null;
    }

    return {
        code: value.code,
        message: value.message,
        correlationId: typeof value.correlationId === "string" ? value.correlationId : null,
        details: value.details ?? null,
    };
}

export async function createHttpApiError(response: Response) {
    const payload = await readApiErrorPayload(response);

    return new ApiError({
        code: payload?.code ?? "API_REQUEST_FAILED",
        message: payload?.message ?? "Не удалось выполнить запрос к API.",
        correlationId: payload?.correlationId ?? null,
        details: payload?.details ?? null,
        status: response.status,
    });
}

async function readApiErrorPayload(response: Response) {
    try {
        return parseApiErrorPayload(await response.json());
    } catch {
        return null;
    }
}

export function createNetworkApiError() {
    return new ApiError({
        code: "NETWORK_ERROR",
        message: "Не удалось подключиться к API.",
        correlationId: null,
        details: null,
        status: null,
    });
}

export function isApiError(value: unknown): value is ApiError {
    return value instanceof ApiError;
}
