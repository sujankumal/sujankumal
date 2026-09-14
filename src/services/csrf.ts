import { apiGet } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export async function csrfToken(): Promise<string> {
  try {
    const data = await apiGet<{ csrfToken?: string }>(API_ENDPOINTS.auth.csrf);
    return data.csrfToken ?? "";
  } catch {
    return "";
  }
}
