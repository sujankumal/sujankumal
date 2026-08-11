import PostListPage from "@/components/PostListPage";
import { fetchJokes } from "@/services/data_access";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { Metadata } from "next";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: "Jokes",
    description: "This page provides concise summaries of key topics and links to related jokes for further exploration.",
    path: "/jokes",
  });
}

async function Jokes() {
  const jokes = await fetchJokes();
  return <PostListPage posts={jokes} path="/jokes" />;
}

export default Jokes;