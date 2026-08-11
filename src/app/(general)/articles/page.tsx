import PostListPage from "@/components/PostListPage";
import { fetchArticles } from "@/services/data_access";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { Metadata } from "next";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: "Articles",
    description: "This page provides concise summaries of key topics and links to related articles for further exploration.",
    path: "/articles",
  });
}

async function Articles() {
  const articles = await fetchArticles();
  return <PostListPage posts={articles} path="/articles" />;
}

export default Articles;