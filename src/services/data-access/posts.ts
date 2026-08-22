import { CACHE_TAGS } from "@/constants/cache-tags";
import { PostTitleType, PostType } from "@/types/post";
import prisma from "../../../prisma/prisma";
import { cacheTag } from "next/cache";
import { apiFetch } from "../api-fetch";
import { isExternalFetchSet } from "./_utils";
import { POST_LIST_SELECT, POST_DETAIL_INCLUDE, byCategoryName } from "./_fragments";

// ─── Post Titles (for nav / ticker) ──────────────────────────────────────────

export async function fetchPostTitle(): Promise<Array<PostTitleType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        select: { id: true, url: true, title: true },
        orderBy: { date: 'desc' },
      });
    }
    return apiFetch<PostTitleType[]>("/api/post/title", [CACHE_TAGS.posts]);
  } catch (error) {
    throw error;
  }
}

export async function fetchPostTitleTicker(): Promise<Array<PostTitleType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        select: { id: true, url: true, title: true },
        orderBy: { date: 'desc' },
        take: 5,
      });
    }
    return apiFetch<PostTitleType[]>("/api/post/title-ticker", [CACHE_TAGS.posts]);
  } catch (error) {
    throw error;
  }
}

// ─── Archives ─────────────────────────────────────────────────────────────────

export async function fetchArchivesDates(): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.archives);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        distinct: ['year', 'month'],
        select: { date: true, month: true, year: true },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }).then();
    }
    return apiFetch<PostType[]>("/api/post/archives", [CACHE_TAGS.posts, CACHE_TAGS.archives]);
  } catch (error) {
    throw error;
  }
}

export async function fetchArchivesByYearAndMonth(year: number, month: number): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.archives);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        where: { AND: { year: Number(year), month: Number(month) } },
        select: POST_LIST_SELECT,
      }).then();
    }
    return apiFetch<PostType[]>(
      `/api/post/archives/${year}/${month}`,
      [CACHE_TAGS.posts, CACHE_TAGS.archives],
    );
  } catch (error) {
    throw error;
  }
}

// ─── Posts — list queries ─────────────────────────────────────────────────────

export async function fetchPostHome(): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        where: byCategoryName('index'),
        orderBy: { id: 'desc' },
        select: POST_LIST_SELECT,
      }).then();
    }
    return apiFetch<PostType[]>("/api/post/home", [CACHE_TAGS.posts]);
  } catch (error) {
    throw error;
  }
}

export async function fetchAbout(): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        where: byCategoryName('about'),
        orderBy: { id: 'desc' },
        take: 1,
        select: { content: true, main_image: true, main_image_credit: true },
      }).then();
    }
    return apiFetch<PostType[]>("/api/post/about", [CACHE_TAGS.posts]);
  } catch (error) {
    throw error;
  }
}

export async function fetchArticles(): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.articles);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        select: POST_LIST_SELECT,
        orderBy: { id: 'desc' },
      }).then();
    }
    return apiFetch<PostType[]>("/api/post/article", [CACHE_TAGS.posts, CACHE_TAGS.articles]);
  } catch (error) {
    throw error;
  }
}

export async function fetchJokes(): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.jokes);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        where: byCategoryName('joke'),
        select: POST_LIST_SELECT,
      }).then();
    }
    return apiFetch<PostType[]>("/api/post/joke", [CACHE_TAGS.posts, CACHE_TAGS.jokes]);
  } catch (error) {
    throw error;
  }
}

export async function fetchTechPosts(): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.tech);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        where: byCategoryName('tech'),
        orderBy: { id: 'desc' },
        select: POST_LIST_SELECT,
      }).then();
    }
    return apiFetch<PostType[]>("/api/post/tech", [CACHE_TAGS.posts, CACHE_TAGS.tech]);
  } catch (error) {
    throw error;
  }
}

export async function fetchPostsByCategoryID(id: number): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.categories, CACHE_TAGS.category(id));
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        where: { categories: { some: { category: { id: Number(id) } } } },
        select: POST_LIST_SELECT,
        orderBy: { date: 'desc' },
      }).then();
    }
    return apiFetch<PostType[]>(
      `/api/post/category/${id}`,
      [CACHE_TAGS.posts, CACHE_TAGS.categories, CACHE_TAGS.category(id)],
    );
  } catch (error) {
    throw error;
  }
}

// ─── Posts — URL / ID arrays (for generateStaticParams) ──────────────────────

export async function fetchPostUrlArray(): Promise<Array<{ url: string }>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({ select: { url: true } });
    }
    return apiFetch<{ url: string }[]>("/api/post/url/", [CACHE_TAGS.posts]);
  } catch (error) {
    throw error;
  }
}

export async function fetchPostCountIdArray(): Promise<Array<{ id: number }>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({ select: { id: true } });
    }
    return apiFetch<{ id: number }[]>("/api/post/count/", [CACHE_TAGS.posts]);
  } catch (error) {
    throw error;
  }
}

export async function fetchPostCountYearMonthArray(): Promise<Array<{ year: number; month: number }>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.archives);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        select: { year: true, month: true },
        orderBy: { id: 'desc' },
      }).then();
    }
    return apiFetch<{ year: number; month: number }[]>(
      "/api/post/count/year-month",
      [CACHE_TAGS.posts, CACHE_TAGS.archives],
    );
  } catch (error) {
    throw error;
  }
}

export async function fetchJokeCountIdArray(): Promise<Array<{ id: number }>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.jokes);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        select: { id: true },
        where: byCategoryName('joke'),
      });
    }
    return apiFetch<{ id: number }[]>("/api/post/joke/count/", [CACHE_TAGS.posts, CACHE_TAGS.jokes]);
  } catch (error) {
    throw error;
  }
}

export async function fetchJokePostsUrl(): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.jokes);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        where: byCategoryName('joke'),
        orderBy: { id: 'desc' },
        select: { id: true, url: true },
      }).then();
    }
    return apiFetch<PostType[]>("/api/post/joke/url", [CACHE_TAGS.posts, CACHE_TAGS.jokes]);
  } catch (error) {
    throw error;
  }
}

export async function fetchTechPostsUrl(): Promise<Array<PostType>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.tech);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        where: byCategoryName('tech'),
        orderBy: { id: 'desc' },
        select: { id: true, url: true },
      }).then();
    }
    return apiFetch<PostType[]>("/api/post/tech/url", [CACHE_TAGS.posts, CACHE_TAGS.tech]);
  } catch (error) {
    throw error;
  }
}

export async function fetchTechPostCountIdArray(): Promise<Array<{ id: number }>> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.tech);
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findMany({
        select: { id: true },
        where: byCategoryName('tech'),
      });
    }
    return apiFetch<{ id: number }[]>("/api/post/tech/count/", [CACHE_TAGS.posts, CACHE_TAGS.tech]);
  } catch (error) {
    throw error;
  }
}

// ─── Posts — single-item detail ───────────────────────────────────────────────

export async function fetchPostBySlug(slug: string): Promise<PostType> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.post(slug));
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findFirst({
        where: { url: slug },
        include: POST_DETAIL_INCLUDE,
      }).then();
    }
    return apiFetch<PostType>(`/api/post/by-url/${slug}`, [CACHE_TAGS.posts, CACHE_TAGS.post(slug)]);
  } catch (error) {
    throw error;
  }
}

export async function fetchPostByID(id: number): Promise<PostType> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.post(id));
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findUnique({
        where: { id: Number(id) },
        include: POST_DETAIL_INCLUDE,
      }).then();
    }
    return apiFetch<PostType>(`/api/post/by-id/${id}`, [CACHE_TAGS.posts, CACHE_TAGS.post(id)]);
  } catch (error) {
    throw error;
  }
}

export async function fetchJokeByID(id: number): Promise<PostType> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.jokes, CACHE_TAGS.post(id));
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findUnique({
        where: { id: Number(id) },
        include: POST_DETAIL_INCLUDE,
      }).then();
    }
    return apiFetch<PostType>(
      `/api/post/joke/by-id/${id}`,
      [CACHE_TAGS.posts, CACHE_TAGS.jokes, CACHE_TAGS.post(id)],
    );
  } catch (error) {
    throw error;
  }
}

export async function fetchTechPostByID(id: number): Promise<PostType> {
  "use cache";
  cacheTag(CACHE_TAGS.posts, CACHE_TAGS.tech, CACHE_TAGS.post(id));
  try {
    if (!isExternalFetchSet()) {
      return prisma.post.findUnique({
        where: { id: Number(id) },
        include: POST_DETAIL_INCLUDE,
      }).then();
    }
    return apiFetch<PostType>(
      `/api/post/tech/by-id/${id}`,
      [CACHE_TAGS.posts, CACHE_TAGS.tech, CACHE_TAGS.post(id)],
    );
  } catch (error) {
    throw error;
  }
}
