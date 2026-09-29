export function geographyErrorMessage(error: unknown, fallback: string) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : "";
    return code === "GEOGRAPHY_ACCESS_DENIED" ? "Географические данные недоступны." : fallback;
}
