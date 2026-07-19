"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckSquare, Copy, ExternalLink, Link2, Loader2, Plus, RefreshCw, Search, Square, Trash2 } from "lucide-react";

type ShortUrlItem = {
  code: string;
  longUrl: string;
  shortUrl: string;
  createdAt?: string;
};

type ListResponse = {
  success: boolean;
  items: ShortUrlItem[];
  cursor?: string;
  complete: boolean;
  limit: number;
};

const LIMIT = 20;

export default function ShortUrlsManager() {
  const [items, setItems] = useState<ShortUrlItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [prefix, setPrefix] = useState("");
  const [activePrefix, setActivePrefix] = useState("");
  const [longUrl, setLongUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentCursor = cursorStack[cursorStack.length - 1] || "";
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allSelected = items.length > 0 && items.every((item) => selectedSet.has(item.code));

  async function loadUrls(cursor = currentCursor, searchPrefix = activePrefix) {
    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({ limit: String(LIMIT) });
    if (cursor) params.set("cursor", cursor);
    if (searchPrefix) params.set("prefix", searchPrefix);

    try {
      const response = await fetch(`/api/short-urls?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load short URLs");
      }

      const list = data as ListResponse;
      setItems(list.items || []);
      setNextCursor(list.cursor);
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load short URLs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUrls("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/short-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ longUrl, customCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details?.[0]?.message || "Could not create short URL");
      }

      setMessage(`Created ${data.shortCode}`);
      setLongUrl("");
      setCustomCode("");
      setCursorStack([]);
      await loadUrls("", activePrefix);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create short URL");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSelected() {
    if (selected.length === 0 || !window.confirm(`Delete ${selected.length} selected short URL(s)?`)) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/short-urls", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: selected }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete selected URLs");
      }

      setMessage(`Deleted ${data.deleted?.length || selected.length} short URL(s)`);
      await loadUrls(currentCursor, activePrefix);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete selected URLs");
    } finally {
      setIsDeleting(false);
    }
  }

  function toggleSelected(code: string) {
    setSelected((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : items.map((item) => item.code));
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPrefix = prefix.trim();
    setActivePrefix(nextPrefix);
    setCursorStack([]);
    loadUrls("", nextPrefix);
  }

  function goNext() {
    if (!nextCursor) return;
    const nextStack = [...cursorStack, nextCursor];
    setCursorStack(nextStack);
    loadUrls(nextCursor, activePrefix);
  }

  function goPrevious() {
    if (cursorStack.length === 0) return;
    const nextStack = cursorStack.slice(0, -1);
    const previousCursor = nextStack[nextStack.length - 1] || "";
    setCursorStack(nextStack);
    loadUrls(previousCursor, activePrefix);
  }

  async function copyShortUrl(shortUrl: string) {
    await navigator.clipboard.writeText(shortUrl);
    setMessage("Short URL copied");
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-orange-600">Admin</p>
            <h1 className="text-xl tracking-normal">Short URLs</h1>
          </div>
          <a
            href="/admin"
            className="inline-flex w-fit items-center justify-center rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100"
          >
            Admin
          </a>
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] w-full min-w-0">
          <div className="rounded-md border border-zinc-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 md:flex-row md:items-center md:justify-between min-w-0">
              <form onSubmit={handleSearch} className="relative flex-1 flex items-center">
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    value={prefix}
                    onChange={(event) => setPrefix(event.target.value)}
                    placeholder="Filter by code prefix"
                    className="h-10 w-full rounded-md border border-zinc-300 pl-9 pr-3 text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <button
                  type="submit"
                  className="absolute right-1 h-8 items-center justify-center rounded-md bg-zinc-950 px-3 text-xs text-white hover:bg-zinc-800"
                >
                  Apply
                </button>
              </form>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadUrls(currentCursor, activePrefix)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 hover:bg-zinc-100"
                  title="Refresh"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selected.length === 0 || isDeleting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  Delete
                </button>
              </div>
            </div>

            {(message || error) && (
              <div className={`border-b px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {error || message}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed text-left text-sm">
                <thead className="bg-zinc-100 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <button type="button" onClick={toggleAll} title="Select all">
                        {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="w-48 px-4 py-3">Code</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="w-36 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                        Loading short URLs
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                        No short URLs found
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.code} className="hover:bg-zinc-50">
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => toggleSelected(item.code)} title={`Select ${item.code}`}>
                            {selectedSet.has(item.code) ? <CheckSquare className="h-4 w-4 text-orange-600" /> : <Square className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold">{item.code}</div>
                          {item.createdAt ? (
                            <div className="mt-1 text-xs text-zinc-500">{new Date(item.createdAt).toLocaleDateString()}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={item.longUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-zinc-700 hover:text-orange-600"
                          >
                            {item.longUrl}
                          </a>
                          <a
                            href={item.shortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-xs text-zinc-500 hover:text-orange-600"
                          >
                            {item.shortUrl}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copyShortUrl(item.shortUrl)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 hover:bg-zinc-100"
                              title="Copy short URL"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <a
                              href={item.shortUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 hover:bg-zinc-100"
                              title="Open short URL"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm">
              <span className="text-zinc-500">Page {cursorStack.length + 1}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={cursorStack.length === 0 || isLoading}
                  className="rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!nextCursor || isLoading}
                  className="rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate} className="h-fit rounded-md border border-zinc-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-orange-600" />
              <h2 className="text-xl font-semibold">Add URL</h2>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Destination URL</span>
              <input
                required
                type="url"
                value={longUrl}
                onChange={(event) => setLongUrl(event.target.value)}
                placeholder="https://example.com/page"
                className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </label>

            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-medium text-zinc-700">Custom code</span>
              <input
                value={customCode}
                onChange={(event) => setCustomCode(event.target.value)}
                placeholder="optional-code"
                className="h-10 w-full rounded-md border border-zinc-300 px-3 font-mono text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Short URL
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
