import { promises as fs } from "fs";
import path from "path";

const IMAGE_EXTENSIONS = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".webp",
    ".avif",
]);

export interface ImageFile {
    path: string;
    name: string;
    folder: string;
}

export async function scanImages(
    directory = path.join(process.cwd(), "public/images"),
    relative = "",
    // rootDirectory is pinned on the first call and passed down to guard against traversal
    rootDirectory?: string
): Promise<ImageFile[]> {
    // On the first (top-level) call, establish the root and resolve it to its
    // real absolute path so symlinks cannot escape the boundary.
    const resolvedRoot = rootDirectory ?? path.resolve(directory);

    // Guard: the directory we are about to read must still be inside the root.
    const resolvedDir = path.resolve(directory);
    if (!resolvedDir.startsWith(resolvedRoot + path.sep) && resolvedDir !== resolvedRoot) {
        // Someone tried to escape the allowed tree — silently abort this branch.
        return [];
    }

    const entries = await fs.readdir(directory, {
        withFileTypes: true,
    });

    let images: ImageFile[] = [];

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        // Guard: resolve symlinks and ensure the target is still inside the root.
        let resolvedFull: string;
        try {
            resolvedFull = await fs.realpath(fullPath);
        } catch {
            // Entry vanished or is otherwise unreadable — skip it.
            continue;
        }

        if (!resolvedFull.startsWith(resolvedRoot + path.sep) && resolvedFull !== resolvedRoot) {
            // Symlink escaping the root — skip.
            continue;
        }

        const relativePath = path.posix.join(relative, entry.name);

        if (entry.isDirectory()) {
            images.push(
                ...(await scanImages(fullPath, relativePath, resolvedRoot))
            );
            continue;
        }

        const ext = path.extname(entry.name).toLowerCase();

        if (!IMAGE_EXTENSIONS.has(ext))
            continue;

        images.push({
            path: `/images/${relativePath.replace(/\\/g, "/")}`,
            name: entry.name,
            folder: relative || "",
        });
    }

    return images.sort((a, b) =>
        a.path.localeCompare(b.path)
    );
}
