"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Modal } from "../Modal";
import { RefreshCw } from "lucide-react";
import { getImageLibrary } from "@/services/api/admin";

interface ImageFile {
    path: string;
    name: string;
    folder: string;
}

interface ImagePickerProps {
    open: boolean;
    value?: string;
    onClose: () => void;
    onSelect: (image: string) => void;
}

const CACHE_KEY = "admin-image-library";
const CACHE_TIME = "admin-image-library-time";
const MAX_AGE = 30 * 60 * 1000;
const ALL_FOLDER = "All Folders";
const ITEM_HEIGHT = 170;
const VIEWPORT_HEIGHT = 600;
const OVERSCAN = 2;
const CARD_WIDTH = 170;

export function ImagePicker({
    open,
    value,
    onClose,
    onSelect,
}: ImagePickerProps) {
    const normalizeImageSelectionValue = (path: string) => {
        if (!path) return "";
        const trimmed = path.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        if (trimmed.startsWith("/images/")) {
            return trimmed.slice("/images/".length);
        }
        return trimmed.replace(/^\/+/, "");
    };
    const [images, setImages] = useState<ImageFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(normalizeImageSelectionValue(value ?? ""));
    const [selectedFolder, setSelectedFolder] = useState(ALL_FOLDER);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [scrollTop, setScrollTop] = useState(0);
    const [columns, setColumns] = useState(5);

    useEffect(() => {
        const scrollElement = scrollRef.current;
        if (!open || loading || !scrollElement) return;

        const updateColumns = () => {
            if (!scrollRef.current) return;

            const width = scrollRef.current.clientWidth;

            setColumns(Math.max(2, Math.floor(width / CARD_WIDTH)));
        };

        updateColumns();

        const observer = new ResizeObserver(updateColumns);
        observer.observe(scrollElement);
        return () => observer.disconnect();
    }, [open, loading]);

    useEffect(() => {
        setSelected(normalizeImageSelectionValue(value ?? ""));
    }, [value]);

    const loadImages = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setLoadError("");

        if (!forceRefresh) {
            try {
                const cached = sessionStorage.getItem(CACHE_KEY);
                const time = Number(sessionStorage.getItem(CACHE_TIME));

                if (cached && time && Date.now() - time < MAX_AGE) {
                    const parsed: unknown = JSON.parse(cached);
                    if (
                        Array.isArray(parsed) &&
                        parsed.every(
                            (image): image is ImageFile =>
                                typeof image?.path === "string" &&
                                typeof image?.name === "string" &&
                                typeof image?.folder === "string"
                        )
                    ) {
                        setImages(parsed);
                        setLoading(false);
                        return;
                    }
                }
            } catch (error) {
                console.warn("Unable to read the cached image library:", error);
            }
        }

        try {
            const data = await getImageLibrary();
            setImages(data);

            try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
                sessionStorage.setItem(CACHE_TIME, String(Date.now()));
            } catch (error) {
                console.warn("Unable to cache the image library:", error);
            }
        } catch (error) {
            console.error("Unable to load the image library:", error);
            setLoadError("Unable to load images. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            void loadImages();
        }
    }, [open, loadImages]);

    const folders = useMemo(() => {
        return [
            ALL_FOLDER,
            ...Array.from(new Set(images.map(i => i.folder))).sort(),
        ];
    }, [images]);

    const filteredImages = useMemo(() => {
        return images.filter(img => {
            const folderMatch =
                selectedFolder === ALL_FOLDER || img.folder === selectedFolder;

            const searchMatch =
                img.name.toLowerCase().includes(search.toLowerCase()) ||
                img.path.toLowerCase().includes(search.toLowerCase());

            return folderMatch && searchMatch;
        });
    }, [images, selectedFolder, search]);

    const totalRows = Math.ceil(filteredImages.length / columns);

    const startRow = Math.max(
        0,
        Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN
    );

    const endRow = Math.min(
        totalRows,
        Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ITEM_HEIGHT) + OVERSCAN
    );

    const visibleImages = filteredImages.slice(
        startRow * columns,
        endRow * columns
    );

    const topSpacer = startRow * ITEM_HEIGHT;
    const bottomSpacer =
        (totalRows - endRow) * ITEM_HEIGHT;

    useEffect(() => {
        setScrollTop(0);
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [filteredImages]);

    useEffect(() => {
        const saved = sessionStorage.getItem("image-library-folder");

        if (saved) {
            setSelectedFolder(saved);
        }
    }, []);

    useEffect(() => {
        sessionStorage.setItem(
            "image-library-folder",
            selectedFolder
        );
    }, [selectedFolder]);
    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title="Image Library"
            size="xl"
        >
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => void loadImages(true)}
                        className="flex items-center gap-2 rounded border px-2 py-1 text-sm hover:bg-gray-100"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Refresh
                    </button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex-1">
                        <input
                            className="w-full border rounded px-2 py-1"
                            placeholder="Search images..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <select
                            className="w-full sm:w-auto border rounded px-2 py-1 text-sm"
                            value={selectedFolder}
                            onChange={e => setSelectedFolder(e.target.value)}
                        >
                            {folders.map(folder => (
                                <option
                                    key={folder}
                                    value={folder}
                                >
                                    {folder || "Root"}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {!loading && loadError && (
                    <div role="alert" className="text-center py-4 text-red-600">
                        {loadError}
                    </div>
                )}
                {!loading && !loadError && filteredImages.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No images found.
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 h-full">

                    {/* LEFT SIDEBAR */}

                    <div className="border rounded-lg overflow-hidden flex flex-col">

                        <div className="px-2 py-1 border-b text-sm bg-gray-50">
                            Folders
                        </div>

                        <div className="overflow-y-auto">

                            {folders.map((folder) => {

                                const count =
                                    folder === ALL_FOLDER
                                        ? images.length
                                        : images.filter(i => i.folder === folder).length;

                                return (
                                    <button
                                        key={folder}
                                        type="button"
                                        onClick={() => setSelectedFolder(folder)}
                                        className={`w-full text-left px-2 py-1 text-sm flex justify-between hover:bg-gray-100 transition
                                            ${selectedFolder === folder
                                                ? "bg-orange-50 text-orange-700"
                                                : ""
                                            }`}
                                    >
                                        <span>
                                            {folder === ALL_FOLDER
                                                ? ALL_FOLDER
                                                : folder.replace("/images/", "") || "Root"}
                                        </span>

                                        <span className="text-xs text-gray-500">
                                            {count}
                                        </span>
                                    </button>
                                );

                            })}

                        </div>

                    </div>

                    {/* RIGHT */}

                    <div className="flex flex-col gap-4 text-sm">

                        <input
                            className="border rounded px-2 py-1 text-sm"
                            placeholder="Search images..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                Loading images...
                            </div>
                        ) : (
                            <div
                                ref={scrollRef}
                                onScroll={(e) =>
                                    setScrollTop(e.currentTarget.scrollTop)
                                }
                                style={{ height: VIEWPORT_HEIGHT }}
                                className="overflow-y-auto"
                            >
                                <div
                                    className="grid gap-x-4"
                                    style={{
                                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                    }}
                                >
                                    {topSpacer > 0 && (
                                        <div
                                            aria-hidden="true"
                                            style={{
                                                height: topSpacer,
                                                gridColumn: "1 / -1",
                                            }}
                                        />
                                    )}

                                    {visibleImages.map((image) => {
                                        const normalizedPath = normalizeImageSelectionValue(image.path);

                                        return (
                                            <button
                                                key={image.path}
                                                type="button"
                                                onClick={() => setSelected(normalizedPath)}
                                                className={`h-[170px] border rounded-lg overflow-hidden transition ${selected === normalizedPath ? "border-orange-500 ring-2 ring-orange-300" : "border-gray-200 hover:border-orange-300"}`}
                                            >

                                                <div className="relative h-[140px] w-full">

                                                    <Image
                                                        src={image.path}
                                                        alt={image.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="160px"
                                                    />

                                                </div>

                                                <div className="h-[30px] w-full p-1">

                                                    <div className="truncate text-xs">
                                                        {image.name}
                                                    </div>

                                                </div>

                                            </button>

                                        );
                                    })}
                                    {bottomSpacer > 0 && (
                                        <div
                                            aria-hidden="true"
                                            style={{
                                                height: bottomSpacer,
                                                gridColumn: "1 / -1",
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                </div>

                <div className="flex justify-end gap-3 border-t pt-4 text-sm">

                    <button
                        className="px-2 py-1 border rounded"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        disabled={!selected}
                        className="px-2 py-1 rounded bg-orange-600 text-white disabled:opacity-50"
                        onClick={() => {
                            onSelect(selected);
                            onClose();
                        }}
                    >
                        Select Image
                    </button>

                </div>

            </div>
        </Modal>
    );
}