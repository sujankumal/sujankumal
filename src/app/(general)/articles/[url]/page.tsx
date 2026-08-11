import PostDetailPage from "@/components/PostDetailPage";
import { fetchPostBySlug, fetchPostUrlArray } from "@/services/data_access";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { ArticleJsonLd, BreadcrumbJsonLd } from "../../../../components/seo/JsonLd";
import { getSiteConfig } from "@/lib/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const instant = false;

export async function generateStaticParams() {
  const urls = await fetchPostUrlArray();
  return urls.map(({ url }) => ({ url: url.toString() }));
}

export async function generateMetadata({ params }: { params: Promise<{ url: string }> }): Promise<Metadata> {
  const { url } = await params;
  const article = await fetchPostBySlug(decodeURIComponent(url));
  if (!article) return {};

  return generateSEOMetadata({
    title: `Articles | ${article.title}`,
    description: article.description,
    path: `/articles/${article.url}`,
    image: article.main_image,
    type: "article",
    publishedTime: article.date?.toISOString(),
  });
}

export default async function Article({ params }: { params: Promise<{ url: string }> }) {
  const { url } = await params;
  const article = await fetchPostBySlug(decodeURIComponent(url));
  if (!article) notFound();

  const cfg = await getSiteConfig();
  const articleUrl = `${cfg.url}/articles/${article.url}`;
  const imageUrl = (() => {
    try { new URL(article.main_image); return article.main_image; }
    catch { return `${cfg.url}/images/${article.main_image}`; }
  })();

  return (
    <>
      <ArticleJsonLd
        headline={article.title}
        description={article.description}
        author={{ name: String(article.author?.name || cfg.name), url: cfg.url }}
        datePublished={article.date.toISOString()}
        dateModified={article.date.toISOString()}
        url={articleUrl}
        image={article.main_image ? [imageUrl] : undefined}
        publisher={{ name: cfg.name, url: cfg.url }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: cfg.url },
          { name: "Articles", url: `${cfg.url}/articles` },
          { name: article.title, url: articleUrl },
        ]}
      />
      <PostDetailPage post={article} />
    </>
  );
}