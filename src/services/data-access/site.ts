import { CACHE_TAGS } from "@/constants/cache-tags";
import { SiteType } from "@/types/site";
import prisma from "../../../prisma/prisma";
import { cacheTag } from "next/cache";
import { apiFetch } from "../api-fetch";
import { isExternalFetchSet } from "./_utils";

export async function fetchSite(): Promise<SiteType> {
  "use cache";
  cacheTag(CACHE_TAGS.site);
  try {
    if (!isExternalFetchSet()) {
      return prisma.site.findFirst({ orderBy: { id: 'desc' } }).then();
    }
    return apiFetch<SiteType>("/api/site", [CACHE_TAGS.site]);
  } catch (error) {
    throw error;
  }
}

export async function fetchSitePrivacyPolicy(): Promise<{ privacy_policy: string }> {
  "use cache";
  cacheTag(CACHE_TAGS.site);
  try {
    if (!isExternalFetchSet()) {
      return prisma.site.findFirst({
        orderBy: { id: 'desc' },
        select: { privacy_policy: true },
      }).then();
    }
    return apiFetch<{ privacy_policy: string }>("/api/site/privacy-policy", [CACHE_TAGS.site]);
  } catch (error) {
    throw error;
  }
}
