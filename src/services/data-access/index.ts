/**
 * Barrel re-export for the data-access layer.
 * All public functions are re-exported here so that existing imports of the
 * domain modules resolve correctly.
 */
export { isExternalFetchSet } from "./_utils";
export { _csrfToken } from "./_csrf";
export { fetchSite, fetchSitePrivacyPolicy } from "./site";
export { fetchProjects } from "./projects";
export {
  fetchCategories,
  fetchCategoryNameArray,
  fetchCategoryCountIdArray,
  fetchCategoryById,
  fetchCategoryByName,
} from "./categories";
export {
  fetchPostTitle,
  fetchPostTitleTicker,
  fetchArchivesDates,
  fetchArchivesByYearAndMonth,
  fetchPostHome,
  fetchAbout,
  fetchArticles,
  fetchJokes,
  fetchTechPosts,
  fetchPostsByCategoryID,
  fetchPostUrlArray,
  fetchPostCountIdArray,
  fetchPostCountYearMonthArray,
  fetchJokeCountIdArray,
  fetchJokePostsUrl,
  fetchTechPostsUrl,
  fetchTechPostCountIdArray,
  fetchPostBySlug,
  fetchPostByID,
  fetchJokeByID,
  fetchTechPostByID,
} from "./posts";
export { fetchSocial, fetchTwitter } from "./social";
export { fetchUpdates } from "./updates";
