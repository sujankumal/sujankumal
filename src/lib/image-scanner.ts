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
    relative = ""
): Promise<ImageFile[]> {
    const entries = await fs.readdir(directory, {
        withFileTypes: true,
    });

    let images: ImageFile[] = [];

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        const relativePath = path.posix.join(relative, entry.name);

        if (entry.isDirectory()) {
            images.push(
                ...(await scanImages(fullPath, relativePath))
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