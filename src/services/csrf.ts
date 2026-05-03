import { API_BASE_URL } from "@/constants/constants";

export async function csrfToken(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
      method: "GET",
    });

    const data = await response.json();
    return data.csrfToken ?? "";
  } catch {
    return "";
  }
}
