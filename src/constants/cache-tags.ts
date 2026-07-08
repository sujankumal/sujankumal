/**
 * Centralized cache tag constants for on-demand revalidation.
 * Used with `cacheTag()` in data access functions and
 * `revalidateTag()` in mutation handlers.
 */
export const CACHE_TAGS = {
  site: "site",
  posts: "posts",
  post: (idOrSlug: string | number) => `post-${idOrSlug}`,
  categories: "categories",
  category: (idOrName: string | number) => `category-${idOrName}`,
  projects: "projects",
  social: "social",
  updates: "updates",
  archives: "archives",
  jokes: "jokes",
  tech: "tech",
  articles: "articles",
} as const;
