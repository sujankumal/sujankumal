import { apiGet } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type SearchResult = {
  url: string;
  title: string;
};

export async function searchData(query: string): Promise<SearchResult[]> {
  try {
    return await apiGet<SearchResult[]>(API_ENDPOINTS.search(query), { revalidate: 10 });
  } catch {
    return [];
  }
}