import { API_BASE_URL } from "@/constants/constants";

/** Returns true when an external API base URL is configured. */
export function isExternalFetchSet(): boolean {
  return API_BASE_URL !== '';
}
