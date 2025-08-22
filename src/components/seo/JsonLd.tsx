import Script from 'next/script';

interface JsonLdProps {
  data: Record<string, any> | Array<Record<string, any>>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
}

// Specific components for different schema types
interface WebSiteJsonLdProps {
  name: string;
  url: string;
  description?: string;
  searchUrl?: string;
}

export function WebSiteJsonLd({ name, url, description, searchUrl }: WebSiteJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    ...(description && { description }),
    ...(searchUrl && {
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: searchUrl,
        },
        "query-input": "required name=search_term_string",
      },
    }),
  };

  return <JsonLd data={jsonLd} />;
}

interface PersonJsonLdProps {
  name: string;
  url?: string;
  email?: string;
  jobTitle?: string;
  sameAs?: string[];
}

export function PersonJsonLd({ name, url, email, jobTitle, sameAs }: PersonJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    ...(url && { url }),
    ...(email && { email }),
    ...(jobTitle && { jobTitle }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };

  return <JsonLd data={jsonLd} />;
}

interface ArticleJsonLdProps {
  headline: string;
  description?: string;
  author: {
    name: string;
    url?: string;
  };
  datePublished: string;
  dateModified?: string;
  url: string;
  image?: string[];
  publisher: {
    name: string;
    url?: string;
  };
}

export function ArticleJsonLd({
  headline,
  description,
  author,
  datePublished,
  dateModified,
  url,
  image,
  publisher,
}: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    ...(description && { description }),
    author: {
      "@type": "Person",
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    datePublished,
    ...(dateModified && { dateModified }),
    url,
    ...(image && { image }),
    publisher: {
      "@type": "Person",
      name: publisher.name,
      ...(publisher.url && { url: publisher.url }),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return <JsonLd data={jsonLd} />;
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={jsonLd} />;
}

interface BlogJsonLdProps {
  name: string;
  description: string;
  url: string;
  author: {
    name: string;
    url?: string;
  };
  posts?: Array<{
    headline: string;
    url: string;
    datePublished: string;
  }>;
}

export function BlogJsonLd({ name, description, url, author, posts }: BlogJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name,
    description,
    url,
    author: {
      "@type": "Person",
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    ...(posts && {
      blogPost: posts.map(post => ({
        "@type": "BlogPosting",
        headline: post.headline,
        url: post.url,
        datePublished: post.datePublished,
        author: {
          "@type": "Person",
          name: author.name,
          ...(author.url && { url: author.url }),
        },
      })),
    }),
  };

  return <JsonLd data={jsonLd} />;
}
