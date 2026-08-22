/**
 * Shared Prisma query fragments used across multiple data-access modules.
 * Kept here to ensure list and detail queries stay consistent without duplication.
 */

/**
 * Standard select shape for post list queries (cards, pagination, etc.).
 * Avoids fetching heavy `content` rows in list views.
 */
export const POST_LIST_SELECT = {
  id: true,
  url: true,
  title: true,
  description: true,
  date: true,
  published: true,
  categories: {
    select: {
      category: {
        select: { id: true, name: true },
      },
    },
  },
  author: {
    select: { id: true, name: true },
  },
} as const;

/**
 * Standard include shape for single-post detail queries (includes content).
 */
export const POST_DETAIL_INCLUDE = {
  categories: {
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
  },
  author: {
    select: { id: true, name: true },
  },
  content: true,
} as const;

/**
 * Build a Prisma `where` clause that filters posts by a case-insensitive category name.
 */
export function byCategoryName(name: string) {
  return {
    categories: {
      some: {
        category: {
          name: { equals: name, mode: 'insensitive' as const },
        },
      },
    },
  };
}
