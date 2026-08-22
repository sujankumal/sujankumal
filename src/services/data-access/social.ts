import { CACHE_TAGS } from "@/constants/cache-tags";
import { SocialType } from "@/types/social";
import prisma from "../../../prisma/prisma";
import { cacheTag } from "next/cache";
import { apiFetch } from "../api-fetch";
import { isExternalFetchSet } from "./_utils";

export async function fetchSocial(): Promise<Array<SocialType>> {
  "use cache";
  cacheTag(CACHE_TAGS.social);
  try {
    if (!isExternalFetchSet()) {
      return prisma.social.findMany();
    }
    return apiFetch<SocialType[]>("/api/social/", [CACHE_TAGS.social]);
  } catch (error) {
    throw error;
  }
}

export async function fetchTwitter(): Promise<Array<SocialType>> {
  "use cache";
  cacheTag(CACHE_TAGS.social);
  try {
    if (!isExternalFetchSet()) {
      return prisma.social.findMany({
        where: { name: { equals: 'twitter', mode: 'insensitive' } },
        select: { embed: true, username: true },
      }).then();
    }
    return apiFetch<SocialType[]>("/api/social/twitter", [CACHE_TAGS.social]);
  } catch (error) {
    throw error;
  }
}
