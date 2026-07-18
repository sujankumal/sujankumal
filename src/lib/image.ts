export function formatImageUrl(url?: string) {
    if (!url || typeof url !== "string") return "";

    const trimmed = url.trim();

    if (!trimmed) return "";

    // External URL
    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://")
    ) {
        return trimmed;
    }

    // Already absolute
    if (trimmed.startsWith("/")) {
        return trimmed;
    }

    // Local image folder
    return `/images/${trimmed}`;
}