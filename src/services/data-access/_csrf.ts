/** CSRF token helper — used by client-side mutation helpers. */
import { apiGet } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function _csrfToken(): Promise<string> {
  try {
    const data = await apiGet<{ csrfToken?: string }>(API_ENDPOINTS.auth.csrf, { revalidate: 10 });
    return data.csrfToken ?? '';
  } catch {
    return '';
  }
}
