import { apiGet } from "@/lib/api/client";

/**
 * Typed fetch helper for app API calls.
 * Centralises request behavior and keeps domain services using a shared contract.
 */
export async function apiFetch<T>(path: string, tags: string[]): Promise<T> {
  return apiGet<T>(path, { tags });
}
