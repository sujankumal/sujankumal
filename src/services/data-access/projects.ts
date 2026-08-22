import { CACHE_TAGS } from "@/constants/cache-tags";
import { ProjectType } from "@/types/project";
import prisma from "../../../prisma/prisma";
import { cacheTag } from "next/cache";
import { apiFetch } from "../api-fetch";
import { isExternalFetchSet } from "./_utils";

export async function fetchProjects(): Promise<ProjectType[]> {
  "use cache";
  cacheTag(CACHE_TAGS.projects);
  try {
    if (!isExternalFetchSet()) {
      return prisma.project.findMany({ orderBy: { title: 'asc' } }).then();
    }
    return apiFetch<ProjectType[]>("/api/project/", [CACHE_TAGS.projects]);
  } catch (error) {
    throw error;
  }
}
