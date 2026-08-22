import { CACHE_TAGS } from "@/constants/cache-tags";
import { UpdateType } from "@/types/update";
import prisma from "../../../prisma/prisma";
import { cacheTag } from "next/cache";
import { apiFetch } from "../api-fetch";
import { isExternalFetchSet } from "./_utils";

export async function fetchUpdates(): Promise<Array<UpdateType>> {
  "use cache";
  cacheTag(CACHE_TAGS.updates);
  try {
    if (!isExternalFetchSet()) {
      return prisma.updates.findMany({ orderBy: { id: 'desc' } }).then();
    }
    return apiFetch<UpdateType[]>("/api/updates/", [CACHE_TAGS.updates]);
  } catch (error) {
    throw error;
  }
}
