import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type ShortUrlItem = {
  code: string;
  longUrl: string;
  shortUrl: string;
  createdAt?: string;
};

export type ListShortUrlsResponse = {
  success: boolean;
  items: ShortUrlItem[];
  cursor?: string;
  complete: boolean;
  limit: number;
};

export async function listShortUrls(params: { limit?: number; cursor?: string; prefix?: string } = {}): Promise<ListShortUrlsResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.prefix) searchParams.set("prefix", params.prefix);

  const query = searchParams.toString();
  return apiClient<ListShortUrlsResponse>(`${API_ENDPOINTS.shortUrls.root}${query ? `?${query}` : ""}`);
}

export async function createShortUrl(payload: { longUrl: string; customCode?: string }): Promise<{ shortCode?: string; error?: string; details?: Array<{ message?: string }> }> {
  return apiClient<{ shortCode?: string; error?: string; details?: Array<{ message?: string }> }>(API_ENDPOINTS.shortUrls.root, {
    method: "POST",
    body: payload,
  });
}

export async function deleteShortUrls(payload: { codes: string[] }): Promise<{ deleted?: string[]; error?: string }> {
  return apiClient<{ deleted?: string[]; error?: string }>(API_ENDPOINTS.shortUrls.root, {
    method: "DELETE",
    body: payload,
  });
}
