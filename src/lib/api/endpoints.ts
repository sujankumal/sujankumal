export const API_ENDPOINTS = {
  auth: {
    csrf: "/api/auth/csrf",
    register: "/api/auth/register",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
  },
  admin: {
    mfa: "/api/admin/mfa",
    images: "/api/admin/images",
    firebase: "/api/admin/firebase",
    relations: "/api/admin/relations",
  },
  posts: {
    home: "/api/post/home",
    about: "/api/post/about",
    article: "/api/post/article",
    joke: "/api/post/joke",
    tech: "/api/post/tech",
    title: "/api/post/title",
    titleTicker: "/api/post/title-ticker",
    archives: "/api/post/archives",
    archivesByMonth: (year: number, month: number) => `/api/post/archives/${year}/${month}`,
    byCategory: (id: number) => `/api/post/category/${id}`,
    byUrl: (slug: string) => `/api/post/by-url/${slug}`,
    byId: (id: number) => `/api/post/by-id/${id}`,
    urlList: "/api/post/url/",
    countList: "/api/post/count/",
    countYearMonth: "/api/post/count/year-month",
  },
  categories: {
    root: "/api/categories",
    nameList: "/api/categories/name/",
    countList: "/api/categories/count/",
    byId: (id: number) => `/api/category/${id}`,
    byName: (name: string) => `/api/categories/${name}`,
  },
  site: {
    root: "/api/site",
    privacyPolicy: "/api/site/privacy-policy",
  },
  social: {
    root: "/api/social/",
    twitter: "/api/social/twitter",
  },
  updates: {
    root: "/api/updates/",
  },
  shortUrls: {
    root: "/api/short-urls",
  },
  firebase: {
    config: "/api/firebase/config",
  },
  search: (query: string) => `/api/search/${encodeURIComponent(query)}`,
};
