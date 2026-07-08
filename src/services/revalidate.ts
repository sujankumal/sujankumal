import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/constants/cache-tags";

/**
 * Maps admin entity names to the cache tags that should be purged
 * when that entity is created, updated, or deleted.
 *
 * When a post changes, we also purge articles/jokes/tech/archives
 * because those are filtered views of posts.
 */
const ENTITY_TAG_MAP: Record<string, string[]> = {
  post: [
    CACHE_TAGS.posts,
    CACHE_TAGS.articles,
    CACHE_TAGS.jokes,
    CACHE_TAGS.tech,
    CACHE_TAGS.archives,
  ],
  category: [CACHE_TAGS.categories, CACHE_TAGS.posts],
  site: [CACHE_TAGS.site],
  social: [CACHE_TAGS.social],
  project: [CACHE_TAGS.projects],
  updates: [CACHE_TAGS.updates],
  content: [
    CACHE_TAGS.posts,
    CACHE_TAGS.articles,
    CACHE_TAGS.jokes,
    CACHE_TAGS.tech,
  ],
  categoriesOnPosts: [CACHE_TAGS.posts, CACHE_TAGS.categories],
};

/**
 * Purges all cache tags associated with a given entity type.
 * Optionally also purges the specific resource tag (e.g. `post-42`).
 */
export function revalidateEntityTags(entity: string, id?: number | string) {
  const tags = ENTITY_TAG_MAP[entity] || [];
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  // Also invalidate the specific resource tag if an id is provided
  if (id !== undefined) {
    if (entity === "post" || entity === "content") {
      revalidateTag(CACHE_TAGS.post(id), "max");
    } else if (entity === "category") {
      revalidateTag(CACHE_TAGS.category(id), "max");
    }
  }
}
