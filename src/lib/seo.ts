import { Metadata } from 'next';

// Base site configuration
export const siteConfig = {
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

// JSON-LD Schema Types
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

// Generate base website schema
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
      email: siteConfig.author.email,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// Generate person schema
export function generatePersonSchema(): PersonSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author.name,
    url: siteConfig.author.url,
    email: siteConfig.author.email,
    jobTitle: "Software Developer",
    sameAs: [
      siteConfig.social.github,
      siteConfig.social.linkedin,
      siteConfig.social.twitter,
    ].filter(Boolean),
  };
}

// Generate article schema
export function generateArticleSchema(article: {
  title: string;
  description?: string;
  publishedAt: string;
  updatedAt?: string;
  slug: string;
  image?: string;
}): ArticleSchema {
  const url = `${siteConfig.url}/articles/${article.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    url,
    image: article.image ? [`${siteConfig.url}/images/${article.image}`] : undefined,
    publisher: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

// Generate breadcrumb schema
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

// Generate base metadata
export function generateMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
  publishedTime,
  modifiedTime,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const fullDescription = description || siteConfig.description;
  const imageUrl = image ? `${siteConfig.url}/images/${image}` : `${siteConfig.url}/bird-1024x576-20.png`;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
    creator: siteConfig.author.name,
    publisher: siteConfig.author.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/bird-32x32-20.gif', sizes: '32x32', type: 'image/gif' },
        { url: '/bird-100x100-20.gif', sizes: '100x100', type: 'image/gif' },
      ],
      apple: [
        { url: '/bird-100x100-20.gif', sizes: '100x100', type: 'image/gif' },
        { url: '/bird-800x800-20.gif', sizes: '800x800', type: 'image/gif' },
      ],
      other: [
        {
          rel: 'mask-icon',
          url: '/bird-32x32-20.gif',
          color: '#000000',
        },
      ],
    },
    manifest: '/site.webmanifest',
    openGraph: {
      type,
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      ...(type === "article" && publishedTime && {
        publishedTime,
        modifiedTime: modifiedTime || publishedTime,
        authors: [siteConfig.author.name],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      creator: siteConfig.social.twitter,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
