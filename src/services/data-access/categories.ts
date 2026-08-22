import { CACHE_TAGS } from "@/constants/cache-tags";
import { CatergoryType } from "@/types/category";
import prisma from "../../../prisma/prisma";
import { cacheTag } from "next/cache";
import { apiFetch } from "../api-fetch";
import { isExternalFetchSet } from "./_utils";

export async function fetchCategories(): Promise<Array<CatergoryType>> {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  try {
    if (!isExternalFetchSet()) {
      return prisma.category.findMany({ orderBy: { name: 'asc' } });
    }
    return apiFetch<CatergoryType[]>("/api/categories", [CACHE_TAGS.categories]);
  } catch (error) {
    throw error;
  }
}

export async function fetchCategoryNameArray(): Promise<Array<{ name: string }>> {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  try {
    if (!isExternalFetchSet()) {
      return prisma.category.findMany({ select: { name: true } });
    }
    return apiFetch<{ name: string }[]>("/api/categories/name/", [CACHE_TAGS.categories]);
  } catch (error) {
    throw error;
  }
}

export async function fetchCategoryCountIdArray(): Promise<Array<{ id: number }>> {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  try {
    if (!isExternalFetchSet()) {
      return prisma.category.findMany({ select: { id: true } });
    }
    return apiFetch<{ id: number }[]>("/api/categories/count/", [CACHE_TAGS.categories]);
  } catch (error) {
    throw error;
  }
}

export async function fetchCategoryById(id: number): Promise<CatergoryType> {
  "use cache";
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.category(id));
  try {
    if (!isExternalFetchSet()) {
      return prisma.category.findUnique({ where: { id: Number(id) } }).then();
    }
    return apiFetch<CatergoryType>(`/api/category/${id}`, [CACHE_TAGS.categories, CACHE_TAGS.category(id)]);
  } catch (error) {
    throw error;
  }
}

export async function fetchCategoryByName(name: string): Promise<CatergoryType> {
  "use cache";
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.category(name));
  try {
    if (!isExternalFetchSet()) {
      return prisma.category.findFirst({ where: { name } }).then();
    }
    return apiFetch<CatergoryType>(`/api/categories/${name}`, [CACHE_TAGS.categories, CACHE_TAGS.category(name)]);
  } catch (error) {
    throw error;
  }
}
