import PostListPage from "@/components/PostListPage";
import { fetchTechPosts } from "@/services/data_access";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { Metadata } from "next";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: "Technologies",
    description: "This page provides concise summaries of key topics and links to related articles of technologies for further exploration.",
    path: "/technologies",
  });
}

async function Technologies() {
  const technologies = await fetchTechPosts();
  return <PostListPage posts={technologies} path="/technologies" />;
}

export default Technologies;