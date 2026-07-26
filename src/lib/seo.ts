import { Metadata } from 'next';
import prisma from '../../prisma/prisma';

// ─── Shared Config Type ───────────────────────────────────────────────────────

export interface SiteConfigType {
  name: string;
  url: string;
  description: string;
  author: {
    name: string;
    email: string;
    url: string;
  };
  social: {
    twitter: string;
    github: string;
    linkedin: string;
  };
  keywords: string[];
}

// ─── Static Fallback Config ───────────────────────────────────────────────────

export const siteConfig: SiteConfigType = {
  name: "Sujan Kumal",
  url: "https://sujankumal.com.np",
  description: "Personal website and blog of Sujan Kumal - Software Developer, Writer, and Tech Enthusiast",
  author: {
    name: "Sujan Kumal",
    email: "support@sujankumal.com.np",
    url: "https://sujankumal.com.np",
  },
  social: {
    twitter: "@sujan_03_",
    github: "https://github.com/sujankumal",
    linkedin: "https://linkedin.com/in/sujankumal",
  },
  keywords: ["Sujan Kumal", "Software Developer", "Blog", "Technology", "Programming", "Web Development"],
};

// ─── Dynamic Config (from DB) ─────────────────────────────────────────────────

export async function getSiteConfig(): Promise<SiteConfigType> {
  try {
    const site = await prisma.site.findFirst({ orderBy: { id: 'desc' } });
    const socials = await prisma.social.findMany();

    const twitterSocial = socials.find(s => s.name.toLowerCase() === 'twitter');
    const githubSocial = socials.find(s => s.name.toLowerCase() === 'github');
    const linkedinSocial = socials.find(s => s.name.toLowerCase() === 'linkedin');

    const name = site?.name + "";
    const url = siteConfig.url;
    const description = site?.description || siteConfig.description;

    return {
      name,
      url,
      description,
      author: {
        name,
        email: site?.contact_email || siteConfig.author.email,
        url,
      },
      social: {
        twitter: twitterSocial ? `@${twitterSocial.username}` : siteConfig.social.twitter,
        github: githubSocial ? `https://github.com/${githubSocial.username}` : siteConfig.social.github,
        linkedin: linkedinSocial ? `https://linkedin.com/in/${linkedinSocial.username}` : siteConfig.social.linkedin,
      },
      keywords: [name, "Software Developer", "Blog", "Technology", "Programming", "Web Development"],
    };
  } catch {
    return siteConfig;
  }
}

// ─── Shared Metadata Constants ────────────────────────────────────────────────

export const ICON_CONFIG = {
  icon: [
    { url: '/favicon.ico' },
    { url: '/bird-32x32-20.png', sizes: '32x32', type: 'image/png' },
    { url: '/bird-100x100-20.png', sizes: '100x100', type: 'image/png' },
  ],
  apple: [
    { url: '/bird-100x100-20.png', sizes: '100x100', type: 'image/png' },
    { url: '/bird-800x800-20.png', sizes: '800x800', type: 'image/png' },
  ]
};

export const ROBOTS_CONFIG = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large' as const,
    'max-snippet': -1,
  },
} as const;

// ─── JSON-LD Schema Types ─────────────────────────────────────────────────────

export interface WebSiteSchema {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  description?: string;
  author?: PersonSchema;
  potentialAction?: SearchActionSchema;
}

export interface PersonSchema {
  "@context"?: "https://schema.org";
  "@type": "Person";
  name: string;
  url?: string;
  email?: string;
  jobTitle?: string;
  worksFor?: OrganizationSchema;
  sameAs?: string[];
}

export interface OrganizationSchema {
  "@type": "Organization";
  name: string;
  url?: string;
}

export interface ArticleSchema {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description?: string;
  author: PersonSchema;
  datePublished: string;
  dateModified?: string;
  url: string;
  image?: string[];
  publisher: PersonSchema;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
}

export interface SearchActionSchema {
  "@type": "SearchAction";
  target: {
    "@type": "EntryPoint";
    urlTemplate: string;
  };
  "query-input": string;
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

// ─── Image URL Helper ─────────────────────────────────────────────────────────

export function resolveImageUrl(image?: string, baseUrl: string = siteConfig.url): string {
  if (!image) return `${baseUrl}/og-image.png`;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.startsWith('/')) return `${baseUrl}${image}`;
  return `${baseUrl}/images/${image}`;
}

// ─── Schema Generators (async, config-injectable) ─────────────────────────────

/** Generate WebSite JSON-LD schema. Pass a pre-fetched config to avoid an extra DB call. */
export async function generateWebSiteSchema(config?: SiteConfigType): Promise<WebSiteSchema> {
  const cfg = config ?? await getSiteConfig();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: cfg.name,
    url: cfg.url,
    description: cfg.description,
    author: {
      "@type": "Person",
      name: cfg.author.name,
      url: cfg.author.url,
      email: cfg.author.email,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${cfg.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Generate Person JSON-LD schema. Pass a pre-fetched config to avoid an extra DB call. */
export async function generatePersonSchema(config?: SiteConfigType): Promise<PersonSchema> {
  const cfg = config ?? await getSiteConfig();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: cfg.author.name,
    url: cfg.author.url,
    email: cfg.author.email,
    jobTitle: "Software Developer",
    sameAs: [
      cfg.social.github,
      cfg.social.linkedin,
      cfg.social.twitter,
    ].filter(Boolean),
  };
}

/** Generate Article JSON-LD schema. Pass a pre-fetched config to avoid an extra DB call. */
export async function generateArticleSchema(
  article: {
    title: string;
    description?: string;
    publishedAt: string;
    updatedAt?: string;
    slug: string;
    image?: string;
  },
  config?: SiteConfigType,
): Promise<ArticleSchema> {
  const cfg = config ?? await getSiteConfig();
  const url = `${cfg.url}/articles/${article.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Person",
      name: cfg.author.name,
      url: cfg.author.url,
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    url,
    image: article.image ? [resolveImageUrl(article.image, cfg.url)] : undefined,
    publisher: {
      "@type": "Person",
      name: cfg.author.name,
      url: cfg.author.url,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

/** Generate breadcrumb JSON-LD schema (synchronous, no config needed). */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

// ─── Metadata Generator ───────────────────────────────────────────────────────

/**
 * Generate Next.js Metadata object from site config.
 * Optionally pass a pre-fetched `config` to avoid a redundant DB call in the same render.
 */
export async function generateMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  config,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  config?: SiteConfigType;
}): Promise<Metadata> {
  const cfg = config ?? await getSiteConfig();
  const formattedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const url = `${cfg.url}${formattedPath}`;
  const fullTitle = title ? `${title} | ${cfg.name}` : cfg.name;
  const fullDescription = description || cfg.description;
  const imageUrl = resolveImageUrl(image, cfg.url);

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: cfg.keywords,
    authors: [{ name: cfg.author.name, url: cfg.author.url }],
    creator: cfg.author.name,
    publisher: cfg.author.name,
    metadataBase: new URL(cfg.url),
    alternates: { canonical: url },
    icons: ICON_CONFIG,
    manifest: '/site.webmanifest',
    openGraph: {
      type,
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: cfg.name,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: fullTitle }],
      ...(type === "article" && publishedTime && {
        publishedTime,
        modifiedTime: modifiedTime || publishedTime,
        authors: [cfg.author.name],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      creator: cfg.social.twitter,
      site: cfg.social.twitter,
      images: [imageUrl],
    },
    robots: ROBOTS_CONFIG,
  };
}


