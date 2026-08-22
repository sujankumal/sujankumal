/**
 * Re-export shell — all data-access logic has been split into focused modules
 * under `./data-access/`. This file is kept so that existing imports of
 * `@/services/data_access` continue to resolve without any consumer changes.
 *
 * To add or modify data-access functions, edit the relevant module:
 *   site.ts | projects.ts | categories.ts | posts.ts | social.ts | updates.ts
 * Shared Prisma fragments live in _fragments.ts.
 */
export * from "./data-access/index";