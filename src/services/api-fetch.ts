import { API_BASE_URL } from "@/constants/constants";

/**
 * Typed fetch helper for all external API calls in data_access.ts.
 * Centralises error handling and removes ~30 instances of repeated boilerplate.
 *
 * @param path   API path, e.g. "/api/post/home"
 * @param tags   Cache tags for Next.js on-demand revalidation
 */
export async function apiFetch<T>(path: string, tags: string[]): Promise<T> {
  const response = await fetch(API_BASE_URL + path, {
    method: "GET",
    next: { tags },
  });
  if (!response.ok) {
    throw new Error(`API fetch failed [${response.status}]: ${path}`);
  }
  return response.json() as Promise<T>;
}
