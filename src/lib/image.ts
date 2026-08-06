export function normalizeImagePath(url?: string) {
    if (!url || typeof url !== "string") return "";

    const trimmed = url.trim();
    if (!trimmed) return "";

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://")
    ) {
        return trimmed;
    }

    const withoutLeadingSlashes = trimmed.replace(/^\/+/, "");
    if (withoutLeadingSlashes.startsWith("images/")) {
        return withoutLeadingSlashes.slice("images/".length);
    }

    return withoutLeadingSlashes;
}

export function formatImageUrl(url?: string) {
    if (!url || typeof url !== "string") return "";

    const trimmed = url.trim();
    if (!trimmed) return "";

    if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://")
    ) {
        return trimmed;
    }

    if (trimmed.startsWith("/")) {
        return trimmed;
    }

    const local = trimmed.replace(/^\/+/, "");
    if (local.startsWith("images/")) {
        return `/${local}`;
    }

    return `/images/${local}`;
}
